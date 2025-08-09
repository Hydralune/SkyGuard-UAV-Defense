"""统计检测型防御（StatisticalDetector）

一个轻量级的对抗样本检测器，基于图像的高频能量比例与拉普拉斯方差两种统计特征，
在无需额外训练数据的情况下对输入图像进行启发式检测。

输出分数 score ∈ [0, 1] 越高越倾向于判定为“可疑/对抗样本”。

参数
- threshold: 判定阈值，默认 0.35。score >= threshold 判定为对抗样本
- alpha: 两种特征的加权系数，score = alpha * HFER + (1-alpha) * LapVarNorm
- hf_ratio: 高频圈半径占比（低频截止），0.1 表示以频谱中心 10% 半径作为低频范围
"""

from __future__ import annotations

from dataclasses import dataclass
import numpy as np
import cv2


@dataclass
class StatisticalDetector:
    threshold: float = 0.35
    alpha: float = 0.6
    hf_ratio: float = 0.1

    def _high_freq_energy_ratio(self, gray: np.ndarray) -> float:
        """计算高频能量占比（HFER）。

        使用 2D FFT，对灰度图频谱能量进行分割：
        - 以中心圆（半径 = hf_ratio * min(H, W)）为低频，其外为高频
        返回 高频能量 / 总能量 ∈ [0,1]
        """
        f = np.fft.fft2(gray.astype(np.float32))
        fshift = np.fft.fftshift(f)
        mag = np.abs(fshift)
        energy = (mag ** 2)

        h, w = energy.shape
        cy, cx = h // 2, w // 2
        r = max(1, int(self.hf_ratio * min(h, w)))

        yy, xx = np.ogrid[:h, :w]
        mask_low = (yy - cy) ** 2 + (xx - cx) ** 2 <= r * r
        low_energy = energy[mask_low].sum()
        total_energy = energy.sum() + 1e-8
        high_energy = total_energy - low_energy
        return float(np.clip(high_energy / total_energy, 0.0, 1.0))

    def _laplacian_variance_norm(self, gray: np.ndarray) -> float:
        """拉普拉斯方差归一化到 [0,1]。
        经验性将方差通过对数与上限裁剪进行归一化，使其具有可比性。
        对抗扰动往往提升高频噪声，拉普拉斯方差会增大。
        """
        lap = cv2.Laplacian(gray, cv2.CV_32F)
        var = float(lap.var())
        # 对数尺度并裁剪到合理区间
        norm = np.log1p(var) / np.log1p(500.0)
        return float(np.clip(norm, 0.0, 1.0))

    def score(self, image_rgb: np.ndarray) -> float:
        if image_rgb is None or image_rgb.size == 0:
            return 0.0
        gray = cv2.cvtColor(image_rgb, cv2.COLOR_RGB2GRAY)
        hfer = self._high_freq_energy_ratio(gray)
        lvar = self._laplacian_variance_norm(gray)
        s = float(self.alpha * hfer + (1.0 - self.alpha) * lvar)
        return float(np.clip(s, 0.0, 1.0))

    def detect(self, image_rgb: np.ndarray) -> tuple[bool, float]:
        s = self.score(image_rgb)
        is_adv = bool(s >= self.threshold)
        return is_adv, s

    def visualize(self, image_rgb: np.ndarray, is_adv: bool, score: float) -> np.ndarray:
        """在图像上叠加检测结果文本"""
        out = image_rgb.copy()
        label = f"ADV? {'YES' if is_adv else 'NO '} | score={score:.2f} thr={self.threshold:.2f}"
        color = (255, 0, 0) if is_adv else (0, 180, 70)
        cv2.rectangle(out, (8, 8), (8 + 440, 38), (0, 0, 0), thickness=-1)
        cv2.putText(out, label, (16, 34), cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2, cv2.LINE_AA)
        return out



