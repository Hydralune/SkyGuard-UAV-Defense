---
license: cc-by-4.0
task_categories:
- object-detection
language:
- en
tags:
- YOLO
pretty_name: VisDrone YOLO format
size_categories:
- 1K<n<10K
---


# VisDrone Dataset (YOLO Format)

## Overview

This repository contains the VisDrone dataset converted into the YOLO (You Only Look Once) format. The VisDrone dataset is a large-scale benchmark for object detection, segmentation, and tracking in drone videos. The dataset includes a variety of challenging scenarios with diverse objects and backgrounds.

## Dataset Details

- **Classes**: 
  - 0: pedestrian
  - 1: people
  - 2: bicycle
  - 3: car
  - 4: van
  - 5: truck
  - 6: tricycle
  - 7: awning-tricycle
  - 8: bus
  - 9: motor
  - 10: others

## Dataset Structure

The dataset is organized as follows inside the ZIP file:

- **images/**: Contains the image files for training, validation, and testing.
  - **train/**: Training images.
  - **val/**: Validation images.
  - **test-dev/**: Test images for development.
  - **test-challenge/**: Test images for the challenge (no labels).
- **labels/**: Contains the corresponding label files in YOLO format.
  - **train/**: Labels for training images.
  - **val/**: Labels for validation images.
- **data.yaml**: Configuration file, specifying paths to images and labels, and class names.


