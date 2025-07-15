#!/usr/bin/env python
# -*- coding: utf-8 -*-
#python backend/evaluate_defense.py     --defense median_blur     --defense_params ksize=5     --num_images 20     --save_dir test_defense_results
"""backend/evaluate_defense.py

Generic evaluation script for testing *input-transformation* defenses against
adversarial attacks. The script mirrors the workflow of
``backend/evaluate_adversarial.py`` but swaps the *attack* with a *defense*
module (sub-classing ``algorithms.defenses.base.BaseDefense``).

Usage example
-------------
$ python backend/evaluate_defense.py \
    --defense median_blur \
    --defense_params ksize=5 \
    --num_images 20 

""" 
import os
import argparse
import cv2
import numpy as np
import matplotlib.pyplot as plt
import json
import time
from collections import defaultdict

from tqdm import tqdm
import importlib

from utils.model_manager import ModelManager
from utils.dataset_manager import DatasetManager
from algorithms.defenses.base import BaseDefense

# ------------------------------------------------------------
# Evaluation class
# ------------------------------------------------------------
class DefenseEvaluator:
    """Evaluator for testing input-transformation defenses.

    The evaluator compares model detections before and after applying a defense
    to the *same* images. This helps quantify the effect of a preprocessing
    defense on *clean* images – useful for ensuring the defense does not overly
    degrade performance. If you have adversarial images, you can simply feed
    them instead of clean ones to measure robustness gain.
    """

    def __init__(
        self,
        model,
        defense: BaseDefense,
        save_dir: str,
        conf_threshold: float = 0.25,
        iou_threshold: float = 0.5,
    ) -> None:
        self.model = model
        self.defense = defense
        self.save_dir = save_dir
        self.conf_threshold = conf_threshold
        self.iou_threshold = iou_threshold

        # directories
        self.results_dir = os.path.join(save_dir, "original_results")
        self.defended_dir = os.path.join(save_dir, "defended_results")
        self.comparison_dir = os.path.join(save_dir, "comparison_results")
        self.metrics_dir = os.path.join(save_dir, "metrics")
        self.plots_dir = os.path.join(save_dir, "plots")

        for d in (
            self.results_dir,
            self.defended_dir,
            self.comparison_dir,
            self.metrics_dir,
            self.plots_dir,
        ):
            os.makedirs(d, exist_ok=True)

        # metrics storage
        self.metrics = {
            "total_images": 0,
            "original_detections": 0,
            "defended_detections": 0,
            "original_conf_scores": [],
            "defended_conf_scores": [],
            "detection_change_rate": [],  # defended/original
            "confidence_change": [],  # defended - original avg
            "inference_times": [],
            "defense_times": [],
            "defense_params": {},
            "detection_by_class_original": defaultdict(int),
            "detection_by_class_defended": defaultdict(int),
        }

    # --------------------------------------------------------
    def evaluate_image(self, image_path: str):
        """Run model on *image_path* with/without defense and log metrics."""
        img_bgr = cv2.imread(image_path)
        if img_bgr is None:
            print(f"[Warning] failed to load image: {image_path}")
            return
        img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)

        # original inference
        t0 = time.time()
        orig_res = self.model.predict(img_rgb)
        infer_time = time.time() - t0

        # apply defense
        t0 = time.time()
        defended_img = self.defense(img_rgb)
        defense_time = time.time() - t0
        defended_img = np.ascontiguousarray(defended_img)

        # defended inference
        defended_res = self.model.predict(defended_img)

        # bookkeeping
        self.metrics["total_images"] += 1
        self.metrics["inference_times"].append(infer_time)
        self.metrics["defense_times"].append(defense_time)

        orig_boxes = orig_res[0].boxes
        def_boxes = defended_res[0].boxes

        self.metrics["original_detections"] += len(orig_boxes)
        self.metrics["defended_detections"] += len(def_boxes)

        # detection change rate
        if len(orig_boxes) > 0:
            self.metrics["detection_change_rate"].append(len(def_boxes) / len(orig_boxes))

        # confidence aggregation
        orig_conf_sum = 0.0
        def_conf_sum = 0.0
        for box in orig_boxes:
            conf = float(box.conf[0].item())
            self.metrics["original_conf_scores"].append(conf)
            cls_name = self.model.names[int(box.cls[0].item())]
            self.metrics["detection_by_class_original"][cls_name] += 1
            orig_conf_sum += conf
        for box in def_boxes:
            conf = float(box.conf[0].item())
            self.metrics["defended_conf_scores"].append(conf)
            cls_name = self.model.names[int(box.cls[0].item())]
            self.metrics["detection_by_class_defended"][cls_name] += 1
            def_conf_sum += conf

        if len(orig_boxes) and len(def_boxes):
            self.metrics["confidence_change"].append(
                (def_conf_sum / len(def_boxes)) - (orig_conf_sum / len(orig_boxes))
            )

        # save visuals
        img_name = os.path.basename(image_path)
        tag = f"{self.metrics['total_images']:04d}_{img_name}"
        cv2.imwrite(os.path.join(self.results_dir, tag), orig_res[0].plot())
        cv2.imwrite(os.path.join(self.defended_dir, tag), defended_res[0].plot())

        # side-by-side
        h, w = img_bgr.shape[:2]
        comp = np.zeros((h, w * 2, 3), dtype=np.uint8)
        comp[:, :w] = cv2.cvtColor(orig_res[0].plot(), cv2.COLOR_BGR2RGB)
        comp[:, w:] = cv2.cvtColor(defended_res[0].plot(), cv2.COLOR_BGR2RGB)
        cv2.imwrite(os.path.join(self.comparison_dir, tag), cv2.cvtColor(comp, cv2.COLOR_RGB2BGR))

    # --------------------------------------------------------
    def evaluate_dataset(self, image_paths):
        print(f"Evaluating defense on {len(image_paths)} images …")
        for p in tqdm(image_paths):
            self.evaluate_image(p)
        self._summarize()
        # create plots before saving metrics so figure files exist
        self.generate_visualizations()
        self._save_metrics()
        print(f"Finished. Results saved under: {self.save_dir}")

    # --------------------------------------------------------
    def _summarize(self):
        self.metrics["summary"] = {
            "avg_inference_time": float(np.mean(self.metrics["inference_times"])) if self.metrics["inference_times"] else 0,
            "avg_defense_time": float(np.mean(self.metrics["defense_times"])) if self.metrics["defense_times"] else 0,
            "detection_retention_rate":
                (self.metrics["defended_detections"] / self.metrics["original_detections"])
                if self.metrics["original_detections"] else 0,
            "avg_detection_change_rate": float(np.mean(self.metrics["detection_change_rate"])) if self.metrics["detection_change_rate"] else 0,
            "avg_confidence_change": float(np.mean(self.metrics["confidence_change"])) if self.metrics["confidence_change"] else 0,
        }

    # --------------------------------------------------------
    def _save_metrics(self):
        metrics_path = os.path.join(self.metrics_dir, "defense_metrics.json")
        # ensure serializable (convert defaultdicts)
        to_save = {
            k: (dict(v) if isinstance(v, defaultdict) else v)
            for k, v in self.metrics.items()
            if k not in {"original_conf_scores", "defended_conf_scores"}
        }
        to_save["defense_params"] = self.metrics["defense_params"]
        with open(metrics_path, "w", encoding="utf-8") as f:
            json.dump(to_save, f, indent=4, ensure_ascii=False)

    # --------------------------------------------------------
    def generate_visualizations(self):
        """Generate basic evaluation plots under *plots_dir*."""
        # 1. Detection count comparison
        plt.figure(figsize=(6, 4))
        plt.bar(["Original", "Defended"], [self.metrics["original_detections"], self.metrics["defended_detections"]], color=["blue", "green"])
        plt.ylabel("Detections")
        plt.title("Detection Count Comparison")
        plt.tight_layout()
        plt.savefig(os.path.join(self.plots_dir, "detection_count_comparison.png"))
        plt.close()

        # 2. Confidence distribution comparison
        if self.metrics["original_conf_scores"] and self.metrics["defended_conf_scores"]:
            plt.figure(figsize=(10, 4))
            plt.subplot(1, 2, 1)
            plt.hist(self.metrics["original_conf_scores"], bins=20, alpha=0.7, color="blue")
            plt.title("Original Confidence")
            plt.xlabel("Conf")
            plt.subplot(1, 2, 2)
            plt.hist(self.metrics["defended_conf_scores"], bins=20, alpha=0.7, color="green")
            plt.title("Defended Confidence")
            plt.xlabel("Conf")
            plt.tight_layout()
            plt.savefig(os.path.join(self.plots_dir, "confidence_distribution_comparison.png"))
            plt.close()

        # 3. Detection change rate per image
        if self.metrics["detection_change_rate"]:
            plt.figure(figsize=(8, 4))
            plt.plot(self.metrics["detection_change_rate"], marker="o", linestyle="-")
            plt.axhline(y=np.mean(self.metrics["detection_change_rate"]), color="r", linestyle="--", label=f"Mean: {np.mean(self.metrics['detection_change_rate']):.2f}")
            plt.xlabel("Image idx")
            plt.ylabel("Defended / Original")
            plt.title("Detection Change Rate per Image")
            plt.legend()
            plt.tight_layout()
            plt.savefig(os.path.join(self.plots_dir, "detection_change_rate.png"))
            plt.close()

        # 4. Confidence change per image
        if self.metrics["confidence_change"]:
            plt.figure(figsize=(8, 4))
            plt.plot(self.metrics["confidence_change"], marker="o", linestyle="-")
            plt.axhline(y=np.mean(self.metrics["confidence_change"]), color="r", linestyle="--", label=f"Mean: {np.mean(self.metrics['confidence_change']):.2f}")
            plt.xlabel("Image idx")
            plt.ylabel("Avg Conf (Def - Orig)")
            plt.title("Confidence Change per Image")
            plt.legend()
            plt.tight_layout()
            plt.savefig(os.path.join(self.plots_dir, "confidence_change.png"))
            plt.close()

# ------------------------------------------------------------
# helper to parse k1=v1,k2=v2 strings
# ------------------------------------------------------------

def _parse_kv_list(kv_str: str):
    if not kv_str:
        return {}
    out = {}
    for token in kv_str.split(","):
        if "=" not in token:
            continue
        k, v = token.split("=", 1)
        # attempt to eval to int/float/bool
        try:
            out[k.strip()] = eval(v)
        except Exception:
            out[k.strip()] = v
    return out

# ------------------------------------------------------------
# dynamic defense loader
# ------------------------------------------------------------

def load_defense(name: str, **kwargs) -> BaseDefense:
    module_name = f"algorithms.defenses.{name.lower()}"
    try:
        module = importlib.import_module(module_name)
    except ModuleNotFoundError as e:
        raise ValueError(
            f"Unsupported defense algorithm: {name}. Expected file backend/{module_name.replace('.', '/')} .py"
        ) from e

    # find subclass
    for attr in dir(module):
        obj = getattr(module, attr)
        if isinstance(obj, type) and issubclass(obj, BaseDefense) and obj is not BaseDefense:
            return obj(**kwargs)
    raise ValueError(f"No defense class found in module {module_name}")

# ------------------------------------------------------------
# main entry
# ------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="Defense Algorithm Evaluation")
    parser.add_argument("--model", type=str, default="yolov8s-visdrone", help="Model name (baseline)")
    parser.add_argument("--dataset", type=str, default="VisDrone", help="Dataset name")
    parser.add_argument("--num_images", type=int, default=10, help="Number of test images (-1 for all)")
    parser.add_argument(
        "--save_dir",
        type=str,
        default="",  # auto-generate under backend/results if empty
        help="Relative directory name under backend/results (leave blank for auto timestamped folder)",
    )
    parser.add_argument("--defense", type=str, required=True, help="Defense algorithm name (e.g. median_blur)")
    parser.add_argument(
        "--defense_params",
        type=str,
        default="",
        help="Comma-separated key=value pairs for defense init, e.g. 'ksize=5'",
    )
    parser.add_argument("--conf_threshold", type=float, default=0.25, help="Model confidence threshold")
    parser.add_argument("--iou_threshold", type=float, default=0.5, help="IoU threshold")

    args = parser.parse_args()

    # -----------------------------------
    # Resolve output directory
    # If user supplied an absolute path, respect it. Otherwise nest inside backend/results
    # and, if no name provided, create a timestamped folder to avoid overwrite.
    # -----------------------------------
    if os.path.isabs(args.save_dir):
        save_dir = args.save_dir
    else:
        # Always create (and nest) inside backend/results/<folder_name>
        base_results = os.path.join("backend", "results")
        os.makedirs(base_results, exist_ok=True)

        if args.save_dir:
            folder_name = args.save_dir.strip("/\\")  # remove any leading/trailing slashes
        else:
            timestamp = time.strftime("%Y%m%d_%H%M%S")
            folder_name = f"{args.defense}_{timestamp}"

        save_dir = os.path.join(base_results, folder_name)
    os.makedirs(save_dir, exist_ok=True)

    # load model (baseline)
    model = ModelManager.load_yolov8_model(model_name=args.model)
    model.overrides["conf"] = args.conf_threshold
    model.overrides["iou"] = args.iou_threshold

    # instantiate defense
    defense_kwargs = _parse_kv_list(args.defense_params)
    defense = load_defense(args.defense, **defense_kwargs)

    print(f"Loaded defense: {defense.__class__.__name__} with params {defense_kwargs}")

    # collect dataset images
    image_paths = DatasetManager.get_test_images(
        dataset_name=args.dataset,
        num_images=args.num_images if args.num_images > 0 else None,
        random_select=args.num_images > 0,
    )
    if not image_paths:
        print("[Error] No images found. Exiting.")
        return

    # evaluator
    evaluator = DefenseEvaluator(
        model=model,
        defense=defense,
        save_dir=save_dir,
        conf_threshold=args.conf_threshold,
        iou_threshold=args.iou_threshold,
    )
    evaluator.metrics["defense_params"] = {"name": args.defense, **defense_kwargs}

    # evaluate
    evaluator.evaluate_dataset(image_paths)

    print("\nEvaluation complete!")
    print(f"Results saved to: {save_dir}")
    print(f"Metrics JSON: {os.path.join(save_dir, 'metrics', 'defense_metrics.json')}")


# ------------------------------------------------------------
# Script entry point
# ------------------------------------------------------------

if __name__ == "__main__":
    main() 