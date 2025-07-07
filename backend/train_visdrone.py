#模型训练测试
#python backend/train_visdrone.py --epochs 50 --run_desc standard_test --model_name yolov8s-visdrone --device 0
import os
import argparse
import json
import shutil
import datetime as _dt
from pathlib import Path
from typing import Union, Optional, Dict, Any
import torch

from ultralytics import YOLO

# Constants for model storage
MODELS_DIR = Path("backend/models")
RUNS_DIR = MODELS_DIR / "runs"
ACTIVE_DIR = MODELS_DIR / "active"
BASELINE_DIR = MODELS_DIR / "baseline"
REGISTRY_PATH = MODELS_DIR / "registry.json"


def _ensure_dirs():
    """Create required directory skeleton."""
    for d in (MODELS_DIR, RUNS_DIR, ACTIVE_DIR, BASELINE_DIR):
        d.mkdir(parents=True, exist_ok=True)


def _timestamp() -> str:
    return _dt.datetime.now().strftime("%Y%m%dT%H%M%S")


def _update_registry(model_name: str, run_id: str, run_info: Dict[str, Any], activate: bool = True) -> None:
    """Insert *run_info* into registry.json and optionally activate it."""
    if REGISTRY_PATH.exists():
        with open(REGISTRY_PATH, "r", encoding="utf-8") as f:
            registry: Dict[str, Any] = json.load(f)
    else:
        registry = {"active": {}, "runs": {}}

    registry.setdefault("runs", {})[run_id] = run_info

    if activate:
        registry.setdefault("active", {})[model_name] = run_info["path"]

    with open(REGISTRY_PATH, "w", encoding="utf-8") as f:
        json.dump(registry, f, indent=2, ensure_ascii=False)

    # Maintain symlink in active directory for immediate use
    if activate:
        ACTIVE_DIR.mkdir(parents=True, exist_ok=True)
        dest = ACTIVE_DIR / f"{model_name}.pt"
        if dest.exists() or dest.is_symlink():
            dest.unlink()
        try:
            dest.symlink_to(Path(run_info["path"]).resolve())
        except OSError:
            # Fallback to copying on platforms without symlink permission
            shutil.copy(run_info["path"], dest)


def train_visdrone(
    base_model: str = "yolov8s.pt",
    data_yaml: str = "backend/datasets/VisDrone_Dataset/visdrone.yaml",
    epochs: int = 100,
    imgsz: int = 640,
    batch: int = 16,
    run_desc: str = "standard_train",
    model_name: str = "yolov8s-visdrone",
    device: Union[str, int, None] = 0,
    activate: bool = True,
):
    """Train a YOLOv8 model on the VisDrone dataset.

    Args:
        base_model: Path to a YOLOv8 pretrained weights file (e.g. 'yolov8s.pt') or model name.
        data_yaml: Path to the dataset YAML definition.
        epochs: Number of training epochs.
        imgsz: Image size (square) fed into the model.
        batch: Batch size per GPU.
        run_desc: Description of the training run.
        model_name: Name of the model.
        device: CUDA device id(s) or "cpu".
        activate: Whether to activate the model after training.
    """

    _ensure_dirs()

    # Where Ultralytics will save the run (project/name)
    project_dir = RUNS_DIR / run_desc
    project_dir.mkdir(parents=True, exist_ok=True)

    print(
        f"[INFO] Starting YOLOv8 training → base_model={base_model}, epochs={epochs}, imgsz={imgsz}, batch={batch}"
    )

    # ------------------------------------------------------------------
    # Temporary patch for PyTorch>=2.6 where torch.load default weights_only=True
    # Ultralytics still expects full pickle. We force weights_only=False.
    # This mirrors logic already present in utils/model_loader.py
    # ------------------------------------------------------------------
    _orig_torch_load = torch.load

    def _patched_torch_load(f, *args, **kwargs):
        kwargs["weights_only"] = False
        return _orig_torch_load(f, *args, **kwargs)

    torch.load = _patched_torch_load

    model = YOLO(base_model)

    # Restore original torch.load once model instantiated
    torch.load = _orig_torch_load

    results = model.train(
        data=data_yaml,
        epochs=epochs,
        imgsz=imgsz,
        batch=batch,
        project=str(project_dir),
        name=model_name,
        device=device,
    )

    # Ultralytics 将 best.pt 保存到 {project}/{name}/weights/best.pt
    run_dir = results.save_dir  # type: ignore[attr-defined]
    best_pt = os.path.join(str(run_dir), "weights", "best.pt")

    # 复制 / 更新主权重路径，方便现有 ModelManager 直接加载
    model_dir = Path(f"backend/{model_name}")
    model_dir.mkdir(parents=True, exist_ok=True)
    final_dest = model_dir / "best.pt"

    if os.path.exists(best_pt):
        print(f"[INFO] Copying {best_pt} → {final_dest}")
        shutil.copy(best_pt, final_dest)
    else:
        print("[WARN] best.pt not found; skipping auto-copy.")

    # Update registry
    run_id = _timestamp()
    run_info = {
        "path": str(final_dest),
        "description": run_desc,
        "timestamp": run_id,
        "epochs": epochs,
    }
    _update_registry(model_name, run_id, run_info, activate)

    print("[DONE] Training complete.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train YOLOv8 on VisDrone dataset (no adversarial defense)")
    parser.add_argument("--base_model", type=str, default="yolov8s.pt", help="Initial weights or model name")
    parser.add_argument(
        "--data_yaml",
        type=str,
        default="backend/datasets/VisDrone_Dataset/visdrone.yaml",
        help="Dataset YAML path",
    )
    parser.add_argument("--epochs", type=int, default=100, help="Number of epochs")
    parser.add_argument("--imgsz", type=int, default=640, help="Training image size")
    parser.add_argument("--batch", type=int, default=16, help="Batch size")
    parser.add_argument(
        "--run_desc",
        type=str,
        default="standard_train",
        help="Description of the training run",
    )
    parser.add_argument("--model_name", type=str, default="yolov8s-visdrone", help="Name of the model")
    parser.add_argument("--device", type=str, default="0", help="CUDA device id or 'cpu'")
    parser.add_argument("--activate", action="store_true", help="Activate the model after training")

    args = parser.parse_args()

    train_visdrone(
        base_model=args.base_model,
        data_yaml=args.data_yaml,
        epochs=args.epochs,
        imgsz=args.imgsz,
        batch=args.batch,
        run_desc=args.run_desc,
        model_name=args.model_name,
        device=args.device,
        activate=args.activate,
    ) 