#!/usr/bin/env python
# -*- coding: utf-8 -*-
#python backend/evaluate_model.py --model yolov8s-visdrone --dataset VisDrone --num_images 10 --save_dir evaluation_results
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
from collections import defaultdict
import time
import torch

class EnhancedEvaluator:
    """Enhanced evaluator providing comprehensive metrics and visualizations"""
    
    def __init__(self, model, save_dir, conf_threshold=0.25, iou_threshold=0.5):
        """
        Initialize the evaluator
        
        Args:
            model: Model to evaluate
            save_dir: Directory to save results
            conf_threshold: Confidence threshold
            iou_threshold: IoU threshold
        """
        self.model = model
        self.save_dir = save_dir
        self.conf_threshold = conf_threshold
        self.iou_threshold = iou_threshold
        
        # Create save directories
        self.results_dir = os.path.join(save_dir, "detection_results")
        self.metrics_dir = os.path.join(save_dir, "metrics")
        self.plots_dir = os.path.join(save_dir, "plots")
        
        os.makedirs(self.results_dir, exist_ok=True)
        os.makedirs(self.metrics_dir, exist_ok=True)
        os.makedirs(self.plots_dir, exist_ok=True)
        
        # Evaluation metrics
        self.metrics = {
            "total_images": 0,
            "total_detections": 0,
            "detection_by_class": defaultdict(int),
            "conf_scores": [],
            "class_names": [],
            "inference_times": []
        }
    
    def evaluate_image(self, image_path, ground_truth=None):
        """
        Evaluate a single image
        
        Args:
            image_path: Path to the image
            ground_truth: Ground truth annotations (if available)
            
        Returns:
            Detection results, inference time
        """
        # Load image
        image = cv2.imread(image_path)
        if image is None:
            print(f"Failed to load image: {image_path}")
            return None, 0
            
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # Perform inference and time it
        start_time = time.time()
        results = self.model.predict(image_rgb)
        inference_time = time.time() - start_time
        
        # Update metrics
        self.metrics["total_images"] += 1
        self.metrics["inference_times"].append(inference_time)
        
        # Process detection results
        boxes = results[0].boxes
        self.metrics["total_detections"] += len(boxes)
        
        # Collect confidence and class for each detection
        for box in boxes:
            cls_id = int(box.cls[0].item())
            conf = float(box.conf[0].item())
            class_name = self.model.names[cls_id]
            
            self.metrics["conf_scores"].append(conf)
            self.metrics["class_names"].append(class_name)
            self.metrics["detection_by_class"][class_name] += 1
        
        # Save detection result image
        result_image = results[0].plot()
        image_name = os.path.basename(image_path)
        unique_name = f"{self.metrics['total_images']:04d}_{image_name}"
        cv2.imwrite(os.path.join(self.results_dir, unique_name), result_image)
        
        return results, inference_time
    
    def evaluate_dataset(self, image_paths):
        """
        Evaluate the entire dataset
        
        Args:
            image_paths: List of image paths
        """
        print(f"Starting evaluation on {len(image_paths)} images...")
        
        # Use tqdm for progress bar
        for image_path in tqdm(image_paths):
            self.evaluate_image(image_path)
        
        # Calculate summary metrics
        self.calculate_summary_metrics()
        
        # Generate visualizations
        self.generate_visualizations()
        
        # Save metrics
        self.save_metrics()
        
        print(f"Evaluation complete! Results saved to {self.save_dir}")
    
    def calculate_summary_metrics(self):
        """Calculate summary metrics"""
        # Calculate average inference time
        avg_inference_time = np.mean(self.metrics["inference_times"]) if self.metrics["inference_times"] else 0
        
        # Calculate average detections per image
        avg_detections_per_image = self.metrics["total_detections"] / self.metrics["total_images"] if self.metrics["total_images"] > 0 else 0
        
        # Add to metrics
        self.metrics["summary"] = {
            "avg_inference_time": avg_inference_time,
            "avg_detections_per_image": avg_detections_per_image,
            "total_detections": self.metrics["total_detections"],
            "total_images": self.metrics["total_images"]
        }
    
    def generate_visualizations(self):
        """Generate visualization charts"""
        # 1. Confidence distribution histogram
        if self.metrics["conf_scores"]:
            plt.figure(figsize=(10, 6))
            plt.hist(self.metrics["conf_scores"], bins=20, alpha=0.7, color='blue')
            plt.title("Confidence Score Distribution")
            plt.xlabel("Confidence")
            plt.ylabel("Count")
            plt.grid(True, alpha=0.3)
            plt.savefig(os.path.join(self.plots_dir, "confidence_distribution.png"))
            plt.close()
        
        # 2. Class distribution bar chart
        if self.metrics["detection_by_class"]:
            plt.figure(figsize=(12, 8))
            classes = list(self.metrics["detection_by_class"].keys())
            counts = list(self.metrics["detection_by_class"].values())
            
            # Sort by count
            sorted_indices = np.argsort(counts)
            classes = [classes[i] for i in sorted_indices]
            counts = [counts[i] for i in sorted_indices]
            
            plt.barh(classes, counts, color='green')
            plt.title("Class Distribution")
            plt.xlabel("Count")
            plt.tight_layout()
            plt.savefig(os.path.join(self.plots_dir, "class_distribution.png"))
            plt.close()
        
        # 3. Inference time distribution
        if self.metrics["inference_times"]:
            plt.figure(figsize=(10, 6))
            plt.hist(self.metrics["inference_times"], bins=20, alpha=0.7, color='purple')
            plt.title("Inference Time Distribution")
            plt.xlabel("Inference Time (seconds)")
            plt.ylabel("Count")
            plt.grid(True, alpha=0.3)
            plt.savefig(os.path.join(self.plots_dir, "inference_time_distribution.png"))
            plt.close()
        
        # 4. If enough classes, generate confusion matrix heatmap
        if len(set(self.metrics["class_names"])) > 1 and len(self.metrics["class_names"]) > 10:
            # Simplified confusion matrix - only show top 10 classes
            class_counts = defaultdict(int)
            for cls in self.metrics["class_names"]:
                class_counts[cls] += 1
            
            top_classes = sorted(class_counts.items(), key=lambda x: x[1], reverse=True)[:10]
            top_class_names = [c[0] for c in top_classes]
            
            # Create a simple confusion matrix (diagonal is class count)
            cm = np.zeros((len(top_class_names), len(top_class_names)))
            for i, cls in enumerate(top_class_names):
                cm[i, i] = class_counts[cls]
            
            plt.figure(figsize=(10, 8))
            sns.heatmap(cm, annot=True, fmt=".0f", xticklabels=top_class_names, yticklabels=top_class_names)
            plt.title("Top 10 Class Distribution")
            plt.xlabel("Predicted Class")
            plt.ylabel("True Class (assumed)")
            plt.tight_layout()
            plt.savefig(os.path.join(self.plots_dir, "class_distribution_heatmap.png"))
            plt.close()
    
    def save_metrics(self):
        """Save evaluation metrics to JSON file"""
        # Convert defaultdict to regular dict for JSON serialization
        metrics_dict = {
            "total_images": self.metrics["total_images"],
            "total_detections": self.metrics["total_detections"],
            "detection_by_class": dict(self.metrics["detection_by_class"]),
            "summary": self.metrics["summary"]
        }
        
        # Add confidence statistics
        if self.metrics["conf_scores"]:
            metrics_dict["confidence_stats"] = {
                "min": min(self.metrics["conf_scores"]),
                "max": max(self.metrics["conf_scores"]),
                "mean": np.mean(self.metrics["conf_scores"]),
                "median": np.median(self.metrics["conf_scores"]),
                "std": np.std(self.metrics["conf_scores"])
            }
        
        # Add inference time statistics
        if self.metrics["inference_times"]:
            metrics_dict["inference_time_stats"] = {
                "min": min(self.metrics["inference_times"]),
                "max": max(self.metrics["inference_times"]),
                "mean": np.mean(self.metrics["inference_times"]),
                "median": np.median(self.metrics["inference_times"]),
                "std": np.std(self.metrics["inference_times"]),
                "total": sum(self.metrics["inference_times"])
            }
        
        # Save to JSON file
        with open(os.path.join(self.metrics_dir, "evaluation_metrics.json"), "w", encoding="utf-8") as f:
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
            <title>Model Evaluation Report</title>
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
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Model Evaluation Report</h1>
                <p>Evaluation Time: {time.strftime("%Y-%m-%d %H:%M:%S")}</p>
                
                <div class="metric-card">
                    <h2>Overall Metrics</h2>
                    <div class="metric-row">
                        <div class="metric-box">
                            <div class="metric-value">{metrics["total_images"]}</div>
                            <div class="metric-label">Total Images</div>
                        </div>
                        <div class="metric-box">
                            <div class="metric-value">{metrics["total_detections"]}</div>
                            <div class="metric-label">Total Detections</div>
                        </div>
                        <div class="metric-box">
                            <div class="metric-value">{metrics["summary"]["avg_detections_per_image"]:.2f}</div>
                            <div class="metric-label">Avg Detections/Image</div>
                        </div>
                        <div class="metric-box">
                            <div class="metric-value">{metrics["summary"]["avg_inference_time"]*1000:.2f} ms</div>
                            <div class="metric-label">Avg Inference Time</div>
                        </div>
                    </div>
                </div>
                
                <div class="metric-card">
                    <h2>Visualizations</h2>
                    <div class="plot-container">
                        <h3>Confidence Distribution</h3>
                        <img src="plots/confidence_distribution.png" alt="Confidence Distribution" style="max-width: 100%;">
                    </div>
                    
                    <div class="plot-container">
                        <h3>Class Distribution</h3>
                        <img src="plots/class_distribution.png" alt="Class Distribution" style="max-width: 100%;">
                    </div>
                    
                    <div class="plot-container">
                        <h3>Inference Time Distribution</h3>
                        <img src="plots/inference_time_distribution.png" alt="Inference Time Distribution" style="max-width: 100%;">
                    </div>
        """
        
        # Add class distribution heatmap if exists
        if os.path.exists(os.path.join(self.plots_dir, "class_distribution_heatmap.png")):
            html_content += """
                    <div class="plot-container">
                        <h3>Top 10 Class Distribution Heatmap</h3>
                        <img src="plots/class_distribution_heatmap.png" alt="Class Distribution Heatmap" style="max-width: 100%;">
                    </div>
            """
        
        # Add class detection statistics table
        html_content += """
                </div>
                
                <div class="metric-card">
                    <h2>Class Detection Statistics</h2>
                    <table>
                        <tr>
                            <th>Class</th>
                            <th>Count</th>
                            <th>Percentage</th>
                        </tr>
        """
        
        # Add class statistics data
        for class_name, count in sorted(metrics["detection_by_class"].items(), key=lambda x: x[1], reverse=True):
            percentage = (count / metrics["total_detections"] * 100) if metrics["total_detections"] > 0 else 0
            html_content += f"""
                        <tr>
                            <td>{class_name}</td>
                            <td>{count}</td>
                            <td>{percentage:.2f}%</td>
                        </tr>
            """
        
        # Add confidence statistics
        if "confidence_stats" in metrics:
            html_content += """
                    </table>
                </div>
                
                <div class="metric-card">
                    <h2>Confidence Statistics</h2>
                    <div class="metric-row">
            """
            
            for stat_name, stat_value in metrics["confidence_stats"].items():
                html_content += f"""
                        <div class="metric-box">
                            <div class="metric-value">{stat_value:.4f}</div>
                            <div class="metric-label">{stat_name.capitalize()}</div>
                        </div>
                """
            
            html_content += """
                    </div>
                </div>
            """
        
        # Add inference time statistics
        if "inference_time_stats" in metrics:
            html_content += """
                <div class="metric-card">
                    <h2>Inference Time Statistics (seconds)</h2>
                    <div class="metric-row">
            """
            
            for stat_name, stat_value in metrics["inference_time_stats"].items():
                if stat_name != "total":  # Skip total time
                    html_content += f"""
                        <div class="metric-box">
                            <div class="metric-value">{stat_value:.4f}</div>
                            <div class="metric-label">{stat_name.capitalize()}</div>
                        </div>
                    """
            
            html_content += f"""
                    </div>
                    <p>Total inference time: {metrics["inference_time_stats"]["total"]:.2f} seconds</p>
                </div>
            """
        
        # Add detection result images gallery
        html_content += """
                <div class="metric-card">
                    <h2>Detection Result Examples</h2>
                    <p>Showing first 10 detection result images:</p>
                    <div class="gallery">
        """
        
        # Add up to 10 detection result images
        result_images = os.listdir(self.results_dir)
        for i, img_file in enumerate(sorted(result_images)[:10]):
            html_content += f"""
                        <img src="../detection_results/{img_file}" alt="Detection Result {i+1}">
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
        with open(os.path.join(self.metrics_dir, "evaluation_report.html"), "w", encoding="utf-8") as f:
            f.write(html_content)


def main():
    parser = argparse.ArgumentParser(description="Enhanced Model Evaluation and Visualization")
    parser.add_argument("--model", type=str, default="yolov8s-visdrone", help="Model name")
    parser.add_argument("--dataset", type=str, default="VisDrone", help="Dataset name")
    parser.add_argument("--num_images", type=int, default=-1, help="Number of test images, -1 for all")
    parser.add_argument("--save_dir", type=str, default="evaluation_results", help="Directory to save results")
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
    
    # Create evaluator
    evaluator = EnhancedEvaluator(
        model=model, 
        save_dir=save_dir,
        conf_threshold=args.conf_threshold,
        iou_threshold=args.iou_threshold
    )
    
    # Perform evaluation
    evaluator.evaluate_dataset(image_paths)
    
    print(f"\nEvaluation complete!")
    print(f"Results saved to: {save_dir}")
    print(f"HTML report: {os.path.join(save_dir, 'metrics', 'evaluation_report.html')}")


if __name__ == "__main__":
    main() 