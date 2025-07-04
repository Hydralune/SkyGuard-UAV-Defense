 # backend/download_dataset.py
import os
import requests
import zipfile
import argparse
from tqdm import tqdm

def download_file(url, destination):
    """下载文件并显示进度条"""
    response = requests.get(url, stream=True)
    total_size = int(response.headers.get('content-length', 0))
    
    with open(destination, 'wb') as file, tqdm(
        desc=os.path.basename(destination),
        total=total_size,
        unit='B',
        unit_scale=True,
        unit_divisor=1024,
    ) as bar:
        for data in response.iter_content(chunk_size=1024):
            size = file.write(data)
            bar.update(size)

def download_dataset(dataset_name, output_dir="backend/datasets"):
    """下载指定数据集"""
    os.makedirs(output_dir, exist_ok=True)
    
    datasets = {
        "drone_detection_maciullo": {
            "url": "https://github.com/Maciullo/DroneDetectionDataset/releases/download/v1.0.0/train_dataset_snippet.zip",
            "description": "DroneDetectionDataset - 训练数据集片段，包含无人机图像和标注"
        },
        "drone_detection_test": {
            "url": "https://github.com/Maciullo/DroneDetectionDataset/releases/download/v1.0.0/test_dataset_snippet.zip",
            "description": "DroneDetectionDataset - 测试数据集片段，包含无人机图像和标注"
        },
        "anti_uav": {
            "url": "https://github.com/ucas-vg/Anti-UAV/archive/refs/heads/main.zip",
            "description": "Anti-UAV 数据集，包含红外和可见光无人机图像"
        },
        "halmstad_drone": {
            "url": "https://github.com/DroneDetectionThesis/Drone-detection-dataset/archive/refs/heads/master.zip",
            "description": "Halmstad Drone Dataset，包含红外、可见光和音频数据"
        },
        "yolov7_drone": {
            "url": "https://github.com/doguilmak/Drone-Detection-YOLOv7/archive/refs/heads/main.zip",
            "description": "YOLOv7 Drone Detection 数据集，包含训练和测试图像"
        }
    }
    
    if dataset_name not in datasets:
        print(f"错误：未找到数据集 '{dataset_name}'")
        print("可用的数据集：")
        for name, info in datasets.items():
            print(f"- {name}: {info['description']}")
        return
    
    dataset = datasets[dataset_name]
    zip_path = os.path.join(output_dir, f"{dataset_name}.zip")
    
    print(f"开始下载数据集: {dataset_name}")
    print(f"描述: {dataset['description']}")
    
    # 下载数据集
    download_file(dataset["url"], zip_path)
    
    # 解压数据集
    print(f"解压数据集到 {output_dir}/{dataset_name}")
    try:
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(os.path.join(output_dir, dataset_name))
        
        # 删除zip文件
        os.remove(zip_path)
        
        print(f"数据集 {dataset_name} 下载完成!")
    except Exception as e:
        print(f"解压数据集时出错: {str(e)}")
        print("请手动解压文件或检查下载是否完整。")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="下载UAV防御系统所需的数据集")
    parser.add_argument("dataset", choices=["drone_detection_maciullo", "drone_detection_test", 
                                           "anti_uav", "halmstad_drone", "yolov7_drone", "all"], 
                        help="要下载的数据集名称，或'all'下载所有数据集")
    args = parser.parse_args()
    
    if args.dataset == "all":
        for dataset in ["drone_detection_maciullo", "drone_detection_test", "yolov7_drone"]:
            download_dataset(dataset)
    else:
        download_dataset(args.dataset)