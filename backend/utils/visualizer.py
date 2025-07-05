# backend/utils/visualizer.py
import os
import cv2
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.colors import LinearSegmentedColormap
import seaborn as sns
from sklearn.metrics import confusion_matrix
from utils.dataset_manager import DatasetManager
import time

class Visualizer:
    """Visualizer for generating various visualization results"""
    
    def __init__(self, save_dir="results"):
        """
        Initialize the visualizer
        
        Args:
            save_dir: Directory to save results
        """
        self.save_dir = save_dir
        
        # Create save directory
        os.makedirs(save_dir, exist_ok=True)
        
        # Create subdirectories
        self.detection_dir = os.path.join(save_dir, "detections")
        self.attack_dir = os.path.join(save_dir, "attacks")
        self.defense_dir = os.path.join(save_dir, "defenses")
        self.metrics_dir = os.path.join(save_dir, "metrics")
        
        os.makedirs(self.detection_dir, exist_ok=True)
        os.makedirs(self.attack_dir, exist_ok=True)
        os.makedirs(self.defense_dir, exist_ok=True)
        os.makedirs(self.metrics_dir, exist_ok=True)
        
        # Set visualization parameters
        self.colors = {
            'detection': (0, 255, 0),  # Green
            'attack': (255, 0, 0),     # Red
            'defense': (0, 0, 255),    # Blue
            'ground_truth': (255, 255, 0)  # Yellow
        }
    
    def visualize_detection(self, image_path, results):
        """
        Visualize detection results
        
        Args:
            image_path: Path to the image
            results: YOLOv8 detection results
            
        Returns:
            Visualized image
        """
        # Get result image
        result_image = results[0].plot()
        
        # Save result
        image_name = os.path.basename(image_path)
        save_path = os.path.join(self.detection_dir, image_name)
        cv2.imwrite(save_path, result_image)
        
        return result_image
    
    def visualize_attack(self, clean_image, adv_image, clean_results=None, adv_results=None):
        """
        Visualize attack results
        
        Args:
            clean_image: Original image
            adv_image: Attacked image
            clean_results: Detection results on original image
            adv_results: Detection results on attacked image
            
        Returns:
            Visualized comparison image
        """
        # Ensure images are uint8 type
        if isinstance(clean_image, np.ndarray) and clean_image.dtype != np.uint8:
            clean_image = (clean_image * 255).astype(np.uint8)
        if isinstance(adv_image, np.ndarray) and adv_image.dtype != np.uint8:
            adv_image = (adv_image * 255).astype(np.uint8)
        
        # Convert to BGR (OpenCV format)
        clean_image_bgr = cv2.cvtColor(clean_image, cv2.COLOR_RGB2BGR)
        adv_image_bgr = cv2.cvtColor(adv_image, cv2.COLOR_RGB2BGR)
        
        # Calculate difference image
        diff = cv2.absdiff(clean_image_bgr, adv_image_bgr)
        diff_heatmap = self._generate_heatmap(diff)
        
        # Create comparison image
        h, w = clean_image_bgr.shape[:2]
        comparison = np.zeros((h, w * 3, 3), dtype=np.uint8)
        comparison[:, :w] = clean_image_bgr
        comparison[:, w:2*w] = adv_image_bgr
        comparison[:, 2*w:] = diff_heatmap
        
        # Add labels
        font = cv2.FONT_HERSHEY_SIMPLEX
        cv2.putText(comparison, "Original", (10, 30), font, 1, (255, 255, 255), 2)
        cv2.putText(comparison, "Adversarial", (w + 10, 30), font, 1, (255, 255, 255), 2)
        cv2.putText(comparison, "Difference", (2 * w + 10, 30), font, 1, (255, 255, 255), 2)
        
        # Save comparison image
        save_path = os.path.join(self.attack_dir, f"attack_comparison_{int(time.time())}.jpg")
        cv2.imwrite(save_path, comparison)
        
        return comparison
    
    def visualize_defense(self, clean_image, adv_image, defended_image, clean_results=None, adv_results=None, defense_results=None):
        """
        Visualize defense results
        
        Args:
            clean_image: Original image
            adv_image: Attacked image
            defended_image: Defended image
            clean_results: Detection results on original image
            adv_results: Detection results on attacked image
            defense_results: Detection results on defended image
            
        Returns:
            Visualized comparison image
        """
        # Ensure images are uint8 type
        if isinstance(clean_image, np.ndarray) and clean_image.dtype != np.uint8:
            clean_image = (clean_image * 255).astype(np.uint8)
        if isinstance(adv_image, np.ndarray) and adv_image.dtype != np.uint8:
            adv_image = (adv_image * 255).astype(np.uint8)
        if isinstance(defended_image, np.ndarray) and defended_image.dtype != np.uint8:
            defended_image = (defended_image * 255).astype(np.uint8)
        
        # Convert to BGR (OpenCV format)
        clean_image_bgr = cv2.cvtColor(clean_image, cv2.COLOR_RGB2BGR)
        adv_image_bgr = cv2.cvtColor(adv_image, cv2.COLOR_RGB2BGR)
        defended_image_bgr = cv2.cvtColor(defended_image, cv2.COLOR_RGB2BGR)
        
        # Create comparison image
        h, w = clean_image_bgr.shape[:2]
        comparison = np.zeros((h, w * 3, 3), dtype=np.uint8)
        comparison[:, :w] = clean_image_bgr
        comparison[:, w:2*w] = adv_image_bgr
        comparison[:, 2*w:] = defended_image_bgr
        
        # Add labels
        font = cv2.FONT_HERSHEY_SIMPLEX
        cv2.putText(comparison, "Original", (10, 30), font, 1, (255, 255, 255), 2)
        cv2.putText(comparison, "Adversarial", (w + 10, 30), font, 1, (255, 255, 255), 2)
        cv2.putText(comparison, "Defended", (2 * w + 10, 30), font, 1, (255, 255, 255), 2)
        
        # Save comparison image
        save_path = os.path.join(self.defense_dir, f"defense_comparison_{int(time.time())}.jpg")
        cv2.imwrite(save_path, comparison)
        
        return comparison
    
    def _generate_heatmap(self, diff_image):
        """
        Generate difference heatmap
        
        Args:
            diff_image: Difference image
            
        Returns:
            Heatmap
        """
        # Convert to grayscale
        if len(diff_image.shape) == 3:
            diff_gray = cv2.cvtColor(diff_image, cv2.COLOR_BGR2GRAY)
        else:
            diff_gray = diff_image
        
        # Apply color mapping
        heatmap = cv2.applyColorMap(diff_gray, cv2.COLORMAP_JET)
        
        return heatmap
    
    def visualize_metrics(self, metrics, title="Model Performance Metrics"):
        """
        Visualize evaluation metrics
        
        Args:
            metrics: Metrics dictionary
            title: Chart title
            
        Returns:
            Chart path
        """
        # Create chart
        plt.figure(figsize=(12, 8))
        
        # Extract metrics
        precision = metrics.get("precision", 0)
        recall = metrics.get("recall", 0)
        f1_score = metrics.get("f1_score", 0)
        ap = metrics.get("ap", 0)
        
        # Draw bar chart
        metrics_names = ["Precision", "Recall", "F1-Score", "AP"]
        metrics_values = [precision, recall, f1_score, ap]
        
        plt.bar(metrics_names, metrics_values, color=['blue', 'green', 'orange', 'red'])
        plt.ylim(0, 1.0)
        plt.title(title)
        plt.ylabel("Score")
        plt.grid(axis='y', linestyle='--', alpha=0.7)
        
        # Show values above bars
        for i, v in enumerate(metrics_values):
            plt.text(i, v + 0.02, f"{v:.4f}", ha='center')
        
        # Save chart
        save_path = os.path.join(self.metrics_dir, f"metrics_{int(time.time())}.png")
        plt.savefig(save_path)
        plt.close()
        
        return save_path
    
    def visualize_confusion_matrix(self, y_true, y_pred, class_names=None):
        """
        Visualize confusion matrix
        
        Args:
            y_true: List of true classes
            y_pred: List of predicted classes
            class_names: List of class names
            
        Returns:
            Chart path
        """
        # Calculate confusion matrix
        cm = confusion_matrix(y_true, y_pred)
        
        # Create chart
        plt.figure(figsize=(10, 8))
        sns.heatmap(cm, annot=True, fmt="d", cmap="Blues", xticklabels=class_names, yticklabels=class_names)
        plt.title("Confusion Matrix")
        plt.ylabel("True Label")
        plt.xlabel("Predicted Label")
        plt.tight_layout()
        
        # Save chart
        save_path = os.path.join(self.metrics_dir, f"confusion_matrix_{int(time.time())}.png")
        plt.savefig(save_path)
        plt.close()
        
        return save_path
    
    def visualize_precision_recall_curve(self, precisions, recalls, ap, class_name=""):
        """
        Visualize precision-recall curve
        
        Args:
            precisions: List of precision values
            recalls: List of recall values
            ap: Average precision
            class_name: Class name
            
        Returns:
            Chart path
        """
        plt.figure(figsize=(10, 8))
        plt.plot(recalls, precisions, 'b-', linewidth=2)
        plt.fill_between(recalls, precisions, alpha=0.2)
        plt.title(f"Precision-Recall Curve - {class_name}")
        plt.xlabel("Recall")
        plt.ylabel("Precision")
        plt.grid(True)
        plt.text(0.5, 0.5, f"AP = {ap:.4f}", ha='center', va='center', transform=plt.gca().transAxes, 
                 bbox=dict(facecolor='white', alpha=0.8))
        
        # Save chart
        save_path = os.path.join(self.metrics_dir, f"pr_curve_{class_name}_{int(time.time())}.png")
        plt.savefig(save_path)
        plt.close()
        
        return save_path
    
    def visualize_detection_with_gt(self, image_path, detection_results, ground_truth=None):
        """
        Visualize detection results compared with ground truth
        
        Args:
            image_path: Path to the image
            detection_results: Detection results
            ground_truth: Ground truth annotations
            
        Returns:
            Visualized image
        """
        # Load image
        image, image_rgb, _ = DatasetManager.load_image(image_path)
        
        # Draw detection results
        result_image = detection_results[0].plot()
        
        # If ground truth is available, draw on image
        if ground_truth:
            for box in ground_truth:
                x, y, w, h, class_id, _ = box
                # Draw ground truth box
                cv2.rectangle(result_image, (int(x), int(y)), (int(x + w), int(y + h)), 
                             self.colors['ground_truth'], 2)
                
                # Get class name
                class_names = DatasetManager.get_class_names()
                class_name = class_names[class_id] if class_id < len(class_names) else f"Class {class_id}"
                
                # Add label
                cv2.putText(result_image, f"GT: {class_name}", (int(x), int(y) - 10), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.5, self.colors['ground_truth'], 2)
        
        # Save result
        image_name = os.path.basename(image_path)
        save_path = os.path.join(self.detection_dir, f"gt_comparison_{image_name}")
        cv2.imwrite(save_path, result_image)
        
        return result_image
    
    def visualize_class_distribution(self, class_counts, title="Class Distribution"):
        """
        Visualize class distribution
        
        Args:
            class_counts: Dictionary of class counts {class_name: count}
            title: Chart title
            
        Returns:
            Chart path
        """
        plt.figure(figsize=(12, 8))
        
        # Sort by count
        sorted_items = sorted(class_counts.items(), key=lambda x: x[1], reverse=True)
        classes = [item[0] for item in sorted_items]
        counts = [item[1] for item in sorted_items]
        
        # Draw bar chart
        plt.barh(classes, counts, color='skyblue')
        plt.title(title)
        plt.xlabel("Count")
        plt.tight_layout()
        
        # Save chart
        save_path = os.path.join(self.metrics_dir, f"class_distribution_{int(time.time())}.png")
        plt.savefig(save_path)
        plt.close()
        
        return save_path
    
    def visualize_confidence_distribution(self, confidences, title="Confidence Score Distribution"):
        """
        Visualize confidence score distribution
        
        Args:
            confidences: List of confidence scores
            title: Chart title
            
        Returns:
            Chart path
        """
        plt.figure(figsize=(10, 6))
        plt.hist(confidences, bins=20, alpha=0.7, color='blue')
        plt.title(title)
        plt.xlabel("Confidence Score")
        plt.ylabel("Count")
        plt.grid(True, alpha=0.3)
        
        # Save chart
        save_path = os.path.join(self.metrics_dir, f"confidence_distribution_{int(time.time())}.png")
        plt.savefig(save_path)
        plt.close()
        
        return save_path