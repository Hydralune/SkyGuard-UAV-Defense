import os
import requests
from tqdm import tqdm
import zipfile

def download_visdrone_dataset(target_dir='backend/datasets'):
    url = 'https://huggingface.co/datasets/banu4prasad/VisDrone-Dataset/resolve/main/VisDrone_Dataset.zip'
    zip_path = os.path.join(target_dir, 'VisDrone_Dataset.zip')
    extract_path = os.path.join(target_dir, 'VisDrone_Dataset')

    os.makedirs(target_dir, exist_ok=True)

    if not os.path.exists(zip_path):
        print("🔽 Downloading VisDrone_Dataset.zip...")
        with requests.get(url, stream=True) as r:
            r.raise_for_status()
            with open(zip_path, 'wb') as f:
                for chunk in tqdm(r.iter_content(chunk_size=8192), desc="Downloading", unit='KB'):
                    if chunk:
                        f.write(chunk)
    else:
        print("✅ VisDrone_Dataset.zip already exists.")

    if not os.path.exists(extract_path):
        print("📦 Extracting dataset...")
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(target_dir)
        print("✅ Extraction complete.")
    else:
        print("✅ Dataset already extracted.")

    return extract_path
