#!/usr/bin/env python
# -*- coding: utf-8 -*-
#python backend/evaluate_adversarial.py --model yolov8s-visdrone --dataset VisDrone --num_images 10 --save_dir adversarial_results --attack pgd --eps 8/255 --steps 10 --alpha 2/255
import os
import argparse
import cv2
import numpy as np
import json
import matplotlib.pyplot as plt
import seaborn as sns
from tqdm import tqdm
from sklearn.metrics import confusion_matrix, precision_recall_curve, average_precision_score
from utils.model_manager import ModelManager
from utils.dataset_manager import DatasetManager
from algorithms.attacks.pgd import PGDAttack
from collections import defaultdict
import time
import torch
import torchvision.transforms as transforms
from PIL import Image
import importlib
from algorithms.attacks.base import BaseAttack

class AdversarialEvaluator:
    """Evaluator for adversarial attacks providing comprehensive metrics and visualizations"""
    
    def __init__(self, model, attack, save_dir, conf_threshold=0.25, iou_threshold=0.5):
        """
        Initialize the evaluator
        
        Args:
            model: Model to evaluate
            attack: Attack algorithm to use
            save_dir: Directory to save results
            conf_threshold: Confidence threshold
            iou_threshold: IoU threshold
        """
        self.model = model
        self.attack = attack
        self.save_dir = save_dir
        self.conf_threshold = conf_threshold
        self.iou_threshold = iou_threshold
        
        # Create save directories
        self.results_dir = os.path.join(save_dir, "detection_results")
        self.adversarial_dir = os.path.join(save_dir, "adversarial_results")
        self.comparison_dir = os.path.join(save_dir, "comparison_results")
        self.perturbation_dir = os.path.join(save_dir, "perturbation_results")
        self.metrics_dir = os.path.join(save_dir, "metrics")
        self.plots_dir = os.path.join(save_dir, "plots")
        
        os.makedirs(self.results_dir, exist_ok=True)
        os.makedirs(self.adversarial_dir, exist_ok=True)
        os.makedirs(self.comparison_dir, exist_ok=True)
        os.makedirs(self.perturbation_dir, exist_ok=True)
        os.makedirs(self.metrics_dir, exist_ok=True)
        os.makedirs(self.plots_dir, exist_ok=True)
        
        # Evaluation metrics
        self.metrics = {
            "total_images": 0,
            "original_detections": 0,
            "adversarial_detections": 0,
            "original_conf_scores": [],
            "adversarial_conf_scores": [],
            "original_class_names": [],
            "adversarial_class_names": [],
            "inference_times": [],
            "attack_times": [],
            "original_detection_by_class": defaultdict(int),
            "adversarial_detection_by_class": defaultdict(int),
            "detection_drop_rate": [],
            "confidence_drop": [],
            "attack_params": {
                "name": attack.name,
                "eps": float(attack.eps),
                "steps": attack.steps,
                "alpha": float(attack.alpha)
            },
            # Class-wise metrics for vulnerability analysis
            "class_vulnerability": defaultdict(lambda: {"original": 0, "adversarial": 0})
        }
        
        # Transformation for converting tensor to PIL image
        self.to_pil = transforms.ToPILImage()
    
    def evaluate_image(self, image_path):
        """
        Evaluate a single image with adversarial attack
        
        Args:
            image_path: Path to the image
            
        Returns:
            Original detection results, adversarial detection results, inference time, attack time
        """
        # Load image
        image = cv2.imread(image_path)
        if image is None:
            print(f"Failed to load image: {image_path}")
            return None, None, 0, 0
            
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # Convert to tensor for attack
        image_tensor = torch.from_numpy(image_rgb.transpose(2, 0, 1)).float() / 255.0
        image_tensor = image_tensor.unsqueeze(0)  # Add batch dimension
        
        # Perform original inference and time it
        start_time = time.time()
        original_results = self.model.predict(image_rgb)
        inference_time = time.time() - start_time
        
        # Perform attack and time it
        start_time = time.time()
        try:
            # 尝试直接调用攻击
            adversarial_tensor = self.attack(self.model, image_tensor)
        except Exception as e:
            print(f"Attack error: {e}")
            # 如果失败，使用原始图像
            adversarial_tensor = image_tensor
        attack_time = time.time() - start_time
        
        # Convert adversarial tensor back to numpy for prediction
        adversarial_image = adversarial_tensor[0].permute(1, 2, 0).cpu().numpy() * 255.0
        adversarial_image = adversarial_image.astype(np.uint8)
        # 需要保证输入给 Annotator 的图像是内存连续的，否则 ultralytics 会 assert 失败
        adversarial_image = np.ascontiguousarray(adversarial_image)
        
        # Perform inference on adversarial image
        adversarial_results = self.model.predict(adversarial_image)
        
        # Update metrics
        self.metrics["total_images"] += 1
        self.metrics["inference_times"].append(inference_time)
        self.metrics["attack_times"].append(attack_time)
        
        # Process original detection results
        original_boxes = original_results[0].boxes
        self.metrics["original_detections"] += len(original_boxes)
        
        # Process adversarial detection results
        adversarial_boxes = adversarial_results[0].boxes
        self.metrics["adversarial_detections"] += len(adversarial_boxes)
        
        # Calculate detection drop rate
        if len(original_boxes) > 0:
            drop_rate = 1.0 - (len(adversarial_boxes) / len(original_boxes))
            self.metrics["detection_drop_rate"].append(drop_rate)
        
        # Collect confidence and class for each detection
        original_conf_sum = 0
        adversarial_conf_sum = 0
        
        # Track classes for vulnerability analysis
        original_classes = {}
        adversarial_classes = {}
        
        for box in original_boxes:
            cls_id = int(box.cls[0].item())
            conf = float(box.conf[0].item())
            class_name = self.model.names[cls_id]
            
            self.metrics["original_conf_scores"].append(conf)
            self.metrics["original_class_names"].append(class_name)
            self.metrics["original_detection_by_class"][class_name] += 1
            original_conf_sum += conf
            
            # Track for vulnerability analysis
            if class_name not in original_classes:
                original_classes[class_name] = 0
            original_classes[class_name] += 1
            self.metrics["class_vulnerability"][class_name]["original"] += 1
        
        for box in adversarial_boxes:
            cls_id = int(box.cls[0].item())
            conf = float(box.conf[0].item())
            class_name = self.model.names[cls_id]
            
            self.metrics["adversarial_conf_scores"].append(conf)
            self.metrics["adversarial_class_names"].append(class_name)
            self.metrics["adversarial_detection_by_class"][class_name] += 1
            adversarial_conf_sum += conf
            
            # Track for vulnerability analysis
            if class_name not in adversarial_classes:
                adversarial_classes[class_name] = 0
            adversarial_classes[class_name] += 1
            self.metrics["class_vulnerability"][class_name]["adversarial"] += 1
        
        # Calculate average confidence drop
        if len(original_boxes) > 0 and len(adversarial_boxes) > 0:
            original_avg_conf = original_conf_sum / len(original_boxes)
            adversarial_avg_conf = adversarial_conf_sum / len(adversarial_boxes)
            conf_drop = original_avg_conf - adversarial_avg_conf
            self.metrics["confidence_drop"].append(conf_drop)
        
        # Save original detection result image
        original_result_image = original_results[0].plot()
        image_name = os.path.basename(image_path)
        unique_name = f"{self.metrics['total_images']:04d}_{image_name}"
        cv2.imwrite(os.path.join(self.results_dir, unique_name), original_result_image)
        
        # Save adversarial detection result image
        adversarial_result_image = adversarial_results[0].plot()
        cv2.imwrite(os.path.join(self.adversarial_dir, unique_name), adversarial_result_image)
        
        # Save perturbation visualization
        perturbation = np.abs(adversarial_image - image_rgb)
        # Enhance perturbation for better visibility
        perturbation_enhanced = np.clip(perturbation * 10, 0, 255).astype(np.uint8)
        cv2.imwrite(os.path.join(self.perturbation_dir, unique_name), 
                    cv2.cvtColor(perturbation_enhanced, cv2.COLOR_RGB2BGR))
        
        # Create side-by-side comparison
        h, w = image.shape[:2]
        comparison = np.zeros((h, w*3, 3), dtype=np.uint8)
        comparison[:, :w] = cv2.cvtColor(original_result_image, cv2.COLOR_BGR2RGB)
        comparison[:, w:2*w] = cv2.cvtColor(adversarial_result_image, cv2.COLOR_BGR2RGB)
        comparison[:, 2*w:] = perturbation_enhanced
        cv2.imwrite(os.path.join(self.comparison_dir, unique_name), 
                    cv2.cvtColor(comparison, cv2.COLOR_RGB2BGR))
        
        return original_results, adversarial_results, inference_time, attack_time
    
    def evaluate_dataset(self, image_paths):
        """
        Evaluate the entire dataset
        
        Args:
            image_paths: List of image paths
        """
        print(f"Starting adversarial evaluation on {len(image_paths)} images...")
        
        # Use tqdm for progress bar
        for image_path in tqdm(image_paths):
            self.evaluate_image(image_path)
        
        # Calculate summary metrics
        self.calculate_summary_metrics()
        
        # Generate visualizations
        self.generate_visualizations()
        
        # Save metrics
        self.save_metrics()
        
        print(f"Adversarial evaluation complete! Results saved to {self.save_dir}")
    
    def calculate_summary_metrics(self):
        """Calculate summary metrics"""
        # Calculate average inference and attack time
        avg_inference_time = np.mean(self.metrics["inference_times"]) if self.metrics["inference_times"] else 0
        avg_attack_time = np.mean(self.metrics["attack_times"]) if self.metrics["attack_times"] else 0
        
        # Calculate average detection drop rate
        avg_detection_drop = np.mean(self.metrics["detection_drop_rate"]) if self.metrics["detection_drop_rate"] else 0
        
        # Calculate average confidence drop
        avg_confidence_drop = np.mean(self.metrics["confidence_drop"]) if self.metrics["confidence_drop"] else 0
        
        # Calculate class vulnerability scores
        class_vulnerability = {}
        for class_name, counts in self.metrics["class_vulnerability"].items():
            if counts["original"] > 0:
                vulnerability_score = 1.0 - (counts["adversarial"] / counts["original"])
                class_vulnerability[class_name] = vulnerability_score
        
        # Add to metrics
        self.metrics["summary"] = {
            "avg_inference_time": avg_inference_time,
            "avg_attack_time": avg_attack_time,
            "total_original_detections": self.metrics["original_detections"],
            "total_adversarial_detections": self.metrics["adversarial_detections"],
            "detection_reduction_rate": 1.0 - (self.metrics["adversarial_detections"] / self.metrics["original_detections"]) if self.metrics["original_detections"] > 0 else 0,
            "avg_detection_drop_rate": avg_detection_drop,
            "avg_confidence_drop": avg_confidence_drop,
            "class_vulnerability": class_vulnerability
        }
    
    def generate_visualizations(self):
        """Generate visualization charts"""
        # 1. Detection count comparison (original vs adversarial)
        plt.figure(figsize=(10, 6))
        labels = ['Original', 'Adversarial']
        counts = [self.metrics["original_detections"], self.metrics["adversarial_detections"]]
        plt.bar(labels, counts, color=['blue', 'red'])
        plt.title("Detection Count Comparison")
        plt.ylabel("Number of Detections")
        plt.grid(True, alpha=0.3)
        plt.savefig(os.path.join(self.plots_dir, "detection_count_comparison.png"))
        plt.close()
        
        # 2. Confidence score distribution comparison
        if self.metrics["original_conf_scores"] and self.metrics["adversarial_conf_scores"]:
            plt.figure(figsize=(12, 6))
            
            plt.subplot(1, 2, 1)
            plt.hist(self.metrics["original_conf_scores"], bins=20, alpha=0.7, color='blue')
            plt.title("Original Confidence Distribution")
            plt.xlabel("Confidence")
            plt.ylabel("Count")
            
            plt.subplot(1, 2, 2)
            plt.hist(self.metrics["adversarial_conf_scores"], bins=20, alpha=0.7, color='red')
            plt.title("Adversarial Confidence Distribution")
            plt.xlabel("Confidence")
            
            plt.tight_layout()
            plt.savefig(os.path.join(self.plots_dir, "confidence_distribution_comparison.png"))
            plt.close()
        
        # 3. Class distribution comparison
        if self.metrics["original_detection_by_class"] and self.metrics["adversarial_detection_by_class"]:
            # Get all unique classes
            all_classes = set(list(self.metrics["original_detection_by_class"].keys()) + 
                              list(self.metrics["adversarial_detection_by_class"].keys()))
            
            # Sort by original count
            classes = sorted(all_classes, 
                            key=lambda x: self.metrics["original_detection_by_class"].get(x, 0),
                            reverse=True)
            
            # Get top 10 classes
            top_classes = classes[:10]
            
            # Prepare data
            original_counts = [self.metrics["original_detection_by_class"].get(cls, 0) for cls in top_classes]
            adversarial_counts = [self.metrics["adversarial_detection_by_class"].get(cls, 0) for cls in top_classes]
            
            # Plot
            plt.figure(figsize=(12, 8))
            x = np.arange(len(top_classes))
            width = 0.35
            
            plt.bar(x - width/2, original_counts, width, label='Original', color='blue')
            plt.bar(x + width/2, adversarial_counts, width, label='Adversarial', color='red')
            
            plt.xlabel('Class')
            plt.ylabel('Count')
            plt.title('Top 10 Class Distribution Comparison')
            plt.xticks(x, top_classes, rotation=45, ha='right')
            plt.legend()
            plt.tight_layout()
            plt.savefig(os.path.join(self.plots_dir, "class_distribution_comparison.png"))
            plt.close()
        
        # 4. Detection drop rate by image
        if self.metrics["detection_drop_rate"]:
            plt.figure(figsize=(10, 6))
            plt.plot(self.metrics["detection_drop_rate"], marker='o', linestyle='-', color='purple')
            plt.axhline(y=np.mean(self.metrics["detection_drop_rate"]), color='r', linestyle='--', 
                      label=f'Mean: {np.mean(self.metrics["detection_drop_rate"]):.2f}')
            plt.title("Detection Drop Rate by Image")
            plt.xlabel("Image Index")
            plt.ylabel("Detection Drop Rate")
            plt.grid(True, alpha=0.3)
            plt.legend()
            plt.tight_layout()
            plt.savefig(os.path.join(self.plots_dir, "detection_drop_rate.png"))
            plt.close()
        
        # 5. Confidence drop by image
        if self.metrics["confidence_drop"]:
            plt.figure(figsize=(10, 6))
            plt.plot(self.metrics["confidence_drop"], marker='o', linestyle='-', color='green')
            plt.axhline(y=np.mean(self.metrics["confidence_drop"]), color='r', linestyle='--', 
                      label=f'Mean: {np.mean(self.metrics["confidence_drop"]):.2f}')
            plt.title("Confidence Drop by Image")
            plt.xlabel("Image Index")
            plt.ylabel("Confidence Drop")
            plt.grid(True, alpha=0.3)
            plt.legend()
            plt.tight_layout()
            plt.savefig(os.path.join(self.plots_dir, "confidence_drop.png"))
            plt.close()
        
        # 6. Class vulnerability analysis
        if self.metrics["summary"]["class_vulnerability"]:
            # Sort by vulnerability score
            classes = sorted(self.metrics["summary"]["class_vulnerability"].items(), 
                           key=lambda x: x[1], reverse=True)
            
            # Get top 10 most vulnerable classes
            top_vulnerable = classes[:10]
            class_names = [cls[0] for cls in top_vulnerable]
            vulnerability_scores = [cls[1] for cls in top_vulnerable]
            
            plt.figure(figsize=(12, 8))
            plt.barh(class_names, vulnerability_scores, color='red')
            plt.title("Top 10 Most Vulnerable Classes")
            plt.xlabel("Vulnerability Score (higher = more vulnerable)")
            plt.tight_layout()
            plt.savefig(os.path.join(self.plots_dir, "class_vulnerability.png"))
            plt.close()
        
        # 7. Attack time distribution
        if self.metrics["attack_times"]:
            plt.figure(figsize=(10, 6))
            plt.hist(self.metrics["attack_times"], bins=20, alpha=0.7, color='orange')
            plt.title("Attack Time Distribution")
            plt.xlabel("Attack Time (seconds)")
            plt.ylabel("Count")
            plt.grid(True, alpha=0.3)
            plt.savefig(os.path.join(self.plots_dir, "attack_time_distribution.png"))
            plt.close()
    
    def save_metrics(self):
        """Save evaluation metrics to JSON file"""
        # Convert defaultdict to regular dict for JSON serialization
        metrics_dict = {
            "total_images": self.metrics["total_images"],
            "original_detections": self.metrics["original_detections"],
            "adversarial_detections": self.metrics["adversarial_detections"],
            "original_detection_by_class": dict(self.metrics["original_detection_by_class"]),
            "adversarial_detection_by_class": dict(self.metrics["adversarial_detection_by_class"]),
            "attack_params": self.metrics["attack_params"],
            "summary": self.metrics["summary"]
        }
        
        # Add confidence statistics
        if self.metrics["original_conf_scores"]:
            metrics_dict["original_confidence_stats"] = {
                "min": min(self.metrics["original_conf_scores"]),
                "max": max(self.metrics["original_conf_scores"]),
                "mean": np.mean(self.metrics["original_conf_scores"]),
                "median": np.median(self.metrics["original_conf_scores"]),
                "std": np.std(self.metrics["original_conf_scores"])
            }
        
        if self.metrics["adversarial_conf_scores"]:
            metrics_dict["adversarial_confidence_stats"] = {
                "min": min(self.metrics["adversarial_conf_scores"]),
                "max": max(self.metrics["adversarial_conf_scores"]),
                "mean": np.mean(self.metrics["adversarial_conf_scores"]),
                "median": np.median(self.metrics["adversarial_conf_scores"]),
                "std": np.std(self.metrics["adversarial_conf_scores"])
            }
        
        # Add time statistics
        if self.metrics["inference_times"]:
            metrics_dict["inference_time_stats"] = {
                "min": min(self.metrics["inference_times"]),
                "max": max(self.metrics["inference_times"]),
                "mean": np.mean(self.metrics["inference_times"]),
                "median": np.median(self.metrics["inference_times"]),
                "std": np.std(self.metrics["inference_times"]),
                "total": sum(self.metrics["inference_times"])
            }
        
        if self.metrics["attack_times"]:
            metrics_dict["attack_time_stats"] = {
                "min": min(self.metrics["attack_times"]),
                "max": max(self.metrics["attack_times"]),
                "mean": np.mean(self.metrics["attack_times"]),
                "median": np.median(self.metrics["attack_times"]),
                "std": np.std(self.metrics["attack_times"]),
                "total": sum(self.metrics["attack_times"])
            }
        
        # Save to JSON file
        with open(os.path.join(self.metrics_dir, "adversarial_metrics.json"), "w", encoding="utf-8") as f:
            json.dump(metrics_dict, f, indent=4, ensure_ascii=False)
        
        # Generate HTML report
        self.generate_html_report(metrics_dict)
    
    def generate_html_report(self, metrics):
        """Generate HTML evaluation report"""
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Adversarial Attack Evaluation Report</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }}
                .container {{ max-width: 1200px; margin: 0 auto; }}
                h1, h2, h3 {{ color: #333; }}
                .metric-card {{ background: #f9f9f9; border-radius: 5px; padding: 15px; margin-bottom: 20px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }}
                .metric-value {{ font-size: 24px; font-weight: bold; color: #0066cc; }}
                .metric-label {{ font-size: 14px; color: #666; }}
                .metric-row {{ display: flex; flex-wrap: wrap; gap: 20px; margin-bottom: 20px; }}
                .metric-box {{ flex: 1; min-width: 200px; }}
                .plot-container {{ margin: 30px 0; }}
                table {{ width: 100%; border-collapse: collapse; margin: 20px 0; }}
                th, td {{ padding: 10px; border: 1px solid #ddd; text-align: left; }}
                th {{ background-color: #f2f2f2; }}
                tr:nth-child(even) {{ background-color: #f9f9f9; }}
                .gallery {{ display: flex; flex-wrap: wrap; gap: 10px; }}
                .gallery img {{ width: 300px; height: auto; border: 1px solid #ddd; border-radius: 4px; }}
                .attack-param {{ color: #d9534f; font-weight: bold; }}
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Adversarial Attack Evaluation Report</h1>
                <p>Evaluation Time: {time.strftime("%Y-%m-%d %H:%M:%S")}</p>
                
                <div class="metric-card">
                    <h2>Attack Parameters</h2>
                    <div class="metric-row">
                        <div class="metric-box">
                            <div class="metric-value">{metrics["attack_params"]["name"]}</div>
                            <div class="metric-label">Attack Type</div>
                        </div>
                        <div class="metric-box">
                            <div class="metric-value attack-param">{metrics["attack_params"]["eps"]}</div>
                            <div class="metric-label">Epsilon (Max Perturbation)</div>
                        </div>
                        <div class="metric-box">
                            <div class="metric-value attack-param">{metrics["attack_params"]["alpha"]}</div>
                            <div class="metric-label">Alpha (Step Size)</div>
                        </div>
                        <div class="metric-box">
                            <div class="metric-value attack-param">{metrics["attack_params"]["steps"]}</div>
                            <div class="metric-label">Iteration Steps</div>
                        </div>
                    </div>
                </div>
                
                <div class="metric-card">
                    <h2>Overall Metrics</h2>
                    <div class="metric-row">
                        <div class="metric-box">
                            <div class="metric-value">{metrics["total_images"]}</div>
                            <div class="metric-label">Total Images</div>
                        </div>
                        <div class="metric-box">
                            <div class="metric-value">{metrics["original_detections"]}</div>
                            <div class="metric-label">Original Detections</div>
                        </div>
                        <div class="metric-box">
                            <div class="metric-value">{metrics["adversarial_detections"]}</div>
                            <div class="metric-label">Adversarial Detections</div>
                        </div>
                        <div class="metric-box">
                            <div class="metric-value">{metrics["summary"]["detection_reduction_rate"]*100:.2f}%</div>
                            <div class="metric-label">Detection Reduction Rate</div>
                        </div>
                    </div>
                    
                    <div class="metric-row">
                        <div class="metric-box">
                            <div class="metric-value">{metrics["summary"]["avg_detection_drop_rate"]*100:.2f}%</div>
                            <div class="metric-label">Avg Detection Drop Rate</div>
                        </div>
                        <div class="metric-box">
                            <div class="metric-value">{metrics["summary"]["avg_confidence_drop"]*100:.2f}%</div>
                            <div class="metric-label">Avg Confidence Drop</div>
                        </div>
                        <div class="metric-box">
                            <div class="metric-value">{metrics["summary"]["avg_inference_time"]*1000:.2f} ms</div>
                            <div class="metric-label">Avg Inference Time</div>
                        </div>
                        <div class="metric-box">
                            <div class="metric-value">{metrics["summary"]["avg_attack_time"]*1000:.2f} ms</div>
                            <div class="metric-label">Avg Attack Time</div>
                        </div>
                    </div>
                </div>
                
                <div class="metric-card">
                    <h2>Visualizations</h2>
                    <div class="plot-container">
                        <h3>Detection Count Comparison</h3>
                        <img src="plots/detection_count_comparison.png" alt="Detection Count Comparison" style="max-width: 100%;">
                    </div>
                    
                    <div class="plot-container">
                        <h3>Confidence Distribution Comparison</h3>
                        <img src="plots/confidence_distribution_comparison.png" alt="Confidence Distribution Comparison" style="max-width: 100%;">
                    </div>
                    
                    <div class="plot-container">
                        <h3>Class Distribution Comparison</h3>
                        <img src="plots/class_distribution_comparison.png" alt="Class Distribution Comparison" style="max-width: 100%;">
                    </div>
                    
                    <div class="plot-container">
                        <h3>Detection Drop Rate by Image</h3>
                        <img src="plots/detection_drop_rate.png" alt="Detection Drop Rate" style="max-width: 100%;">
                    </div>
                    
                    <div class="plot-container">
                        <h3>Confidence Drop by Image</h3>
                        <img src="plots/confidence_drop.png" alt="Confidence Drop" style="max-width: 100%;">
                    </div>
                    
                    <div class="plot-container">
                        <h3>Class Vulnerability Analysis</h3>
                        <img src="plots/class_vulnerability.png" alt="Class Vulnerability" style="max-width: 100%;">
                    </div>
                    
                    <div class="plot-container">
                        <h3>Attack Time Distribution</h3>
                        <img src="plots/attack_time_distribution.png" alt="Attack Time Distribution" style="max-width: 100%;">
                    </div>
                </div>
                
                <div class="metric-card">
                    <h2>Class Vulnerability Analysis</h2>
                    <table>
                        <tr>
                            <th>Class</th>
                            <th>Original Count</th>
                            <th>Adversarial Count</th>
                            <th>Vulnerability Score</th>
                        </tr>
        """
        
        # Add class vulnerability data
        for class_name, vuln_score in sorted(metrics["summary"]["class_vulnerability"].items(), 
                                           key=lambda x: x[1], reverse=True):
            original_count = metrics["original_detection_by_class"].get(class_name, 0)
            adversarial_count = metrics["adversarial_detection_by_class"].get(class_name, 0)
            
            html_content += f"""
                        <tr>
                                                        <td>{class_name}</td>
                            <td>{original_count}</td>
                            <td>{adversarial_count}</td>
                            <td>{vuln_score*100:.2f}%</td>
                        </tr>
        """
        
        # End table and add example images
        html_content += """
                    </table>
                </div>
                
                <div class="metric-card">
                    <h2>Example Results</h2>
                    <p>Original vs Adversarial vs Perturbation Comparison:</p>
                    <div class="gallery">
        """
        
        # Add up to 5 comparison images
        comparison_images = os.listdir(self.comparison_dir)
        for i, img_file in enumerate(sorted(comparison_images)[:5]):
            html_content += f"""
                        <img src="../comparison_results/{img_file}" alt="Comparison {i+1}">
            """
        
        # End HTML
        html_content += """
                    </div>
                </div>
            </div>
        </body>
        </html>
        """
        
        # Save HTML report
        with open(os.path.join(self.metrics_dir, "adversarial_report.html"), "w", encoding="utf-8") as f:
            f.write(html_content)


def parse_fraction(fraction_str):
    """Parse a fraction string like '8/255' into a float"""
    if '/' in fraction_str:
        num, denom = fraction_str.split('/')
        return float(num) / float(denom)
    return float(fraction_str)


def main():
    parser = argparse.ArgumentParser(description="Adversarial Attack Evaluation")
    parser.add_argument("--model", type=str, default="yolov8s-visdrone", help="Model name")
    parser.add_argument("--dataset", type=str, default="VisDrone", help="Dataset name")
    parser.add_argument("--num_images", type=int, default=-1, help="Number of test images, -1 for all")
    parser.add_argument("--save_dir", type=str, default="adversarial_results", help="Directory to save results")
    parser.add_argument("--attack", type=str, default="pgd", help="Attack algorithm (pgd)")
    parser.add_argument("--eps", type=str, default="8/255", help="Epsilon value (max perturbation)")
    parser.add_argument("--alpha", type=str, default="2/255", help="Alpha value (step size)")
    parser.add_argument("--steps", type=int, default=10, help="Number of attack iterations")
    parser.add_argument("--conf_threshold", type=float, default=0.25, help="Confidence threshold")
    parser.add_argument("--iou_threshold", type=float, default=0.5, help="IoU threshold")
    args = parser.parse_args()
    
    # Create save directory
    save_dir = os.path.join("backend", args.save_dir)
    os.makedirs(save_dir, exist_ok=True)
    
    print(f"Loading model: {args.model}")
    # Load model
    model = ModelManager.load_yolov8_model(model_name=args.model)
    
    # Set model parameters
    model.overrides['conf'] = args.conf_threshold  # Confidence threshold
    model.overrides['iou'] = args.iou_threshold    # IoU threshold
    
    # Parse fraction values
    eps = parse_fraction(args.eps)
    alpha = parse_fraction(args.alpha)
    
    # Initialize attack algorithm
    def load_attack(name: str, **kwargs):
        """Dynamically import an attack class located in algorithms/attacks/NAME.py"""
        module_name = f"algorithms.attacks.{name.lower()}"
        try:
            module = importlib.import_module(module_name)
        except ModuleNotFoundError as e:
            raise ValueError(f"Unsupported attack algorithm: {name}. Expected file backend/{module_name.replace('.', '/')} .py") from e

        # Find concrete subclass of BaseAttack inside module
        for attr in dir(module):
            obj = getattr(module, attr)
            if isinstance(obj, type) and issubclass(obj, BaseAttack) and obj is not BaseAttack:
                return obj(**kwargs)
        raise ValueError(f"No attack class found in module {module_name}")

    attack = load_attack(args.attack, eps=eps, alpha=alpha, steps=args.steps)
    
    print(f"Loading dataset: {args.dataset}")
    # Get test images
    image_paths = DatasetManager.get_test_images(
        dataset_name=args.dataset, 
        num_images=args.num_images if args.num_images > 0 else None,
        random_select=args.num_images > 0  # Randomly select if number is specified
    )
    
    if not image_paths:
        print(f"Error: No images found for dataset {args.dataset}")
        return
    
    print(f"Found {len(image_paths)} images")
    print(f"Using {args.attack} attack with eps={eps}, alpha={alpha}, steps={args.steps}")
    
    # Create evaluator
    evaluator = AdversarialEvaluator(
        model=model, 
        attack=attack,
        save_dir=save_dir,
        conf_threshold=args.conf_threshold,
        iou_threshold=args.iou_threshold
    )
    
    # Perform evaluation
    evaluator.evaluate_dataset(image_paths)
    
    print(f"\nAdversarial evaluation complete!")
    print(f"Results saved to: {save_dir}")
    print(f"HTML report: {os.path.join(save_dir, 'metrics', 'adversarial_report.html')}")


if __name__ == "__main__":
    main()