#模型瘦身函数
import shutil, torch, os

# -------- Patch torch.load (PyTorch ≥2.6) --------
_orig_load = torch.load
def _patched_load(*args, **kwargs):
    kwargs.setdefault("weights_only", False)   # 关键：禁用 weights-only 模式
    return _orig_load(*args, **kwargs)
torch.load = _patched_load
# -------------------------------------------------

from ultralytics.yolo.utils.torch_utils import strip_optimizer

run_dir   = "backend/models/runs/standard_test/yolov8s-visdrone4"
src_ckpt  = os.path.join(run_dir, "weights", "best.pt")
dst_ckpt  = os.path.join(run_dir, "best.pt")          # 复制后的全量 FP32
fp16_ckpt = os.path.join(run_dir, "best_fp16.pt")     # 瘦身后的推理权重

# 1) 复制
shutil.copy(src_ckpt, dst_ckpt)
print(f"Copied → {dst_ckpt}")

# 2) strip_optimizer（去掉 EMA / optimizer）
strip_optimizer(dst_ckpt)            # 就地瘦掉一半大小，仍为 FP32

# 3) 转 FP16 并仅保留 model
ckpt = torch.load(dst_ckpt, map_location="cpu")  # 此时已是 weights_only=False
ckpt["model"].half()                 # to FP16
torch.save({"model": ckpt["model"]}, fp16_ckpt)
print(f"Saved FP16 weights-only → {fp16_ckpt}")