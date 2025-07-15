import os
import shutil
import zipfile
from pathlib import Path

import requests
from tqdm import tqdm

def download_visdrone_dataset(target_dir: str = 'backend/datasets') -> str:
    """Download and extract the VisDrone dataset.

    The function guarantees that the final dataset root is
    ``backend/datasets/VisDrone_Dataset`` regardless of how the ZIP archive is
    structured (it sometimes contains an extra top-level folder).
    Returns the absolute path to the dataset root.
    """

    url = (
        'https://huggingface.co/datasets/banu4prasad/VisDrone-Dataset/resolve/main/VisDrone_Dataset.zip'
    )

    target_dir_path = Path(target_dir)
    dataset_dir = target_dir_path / 'VisDrone_Dataset'
    zip_path = target_dir_path / 'VisDrone_Dataset.zip'

    target_dir_path.mkdir(parents=True, exist_ok=True)

    # ------------------------------------------------------------
    # Download ZIP if missing
    # ------------------------------------------------------------
    if not zip_path.exists():
        print('🔽 Downloading VisDrone_Dataset.zip...')
        with requests.get(url, stream=True) as r:
            r.raise_for_status()
            with open(zip_path, 'wb') as f:
                for chunk in tqdm(r.iter_content(chunk_size=8192), desc='Downloading', unit='KB'):
                    if chunk:
                        f.write(chunk)
    else:
        print('✅ VisDrone_Dataset.zip already exists.')

    # ------------------------------------------------------------
    # Extract if dataset folder not present
    # ------------------------------------------------------------
    if not dataset_dir.exists():
        print('📦 Extracting dataset...')
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(target_dir)

        # Some archives contain an extra root folder; flatten if necessary
        nested_dir = dataset_dir / 'VisDrone_Dataset'
        if nested_dir.exists():
            for item in nested_dir.iterdir():
                shutil.move(str(item), dataset_dir)
            nested_dir.rmdir()

        print('✅ Extraction complete.')
    else:
        print('✅ Dataset already extracted.')

    return str(dataset_dir)
