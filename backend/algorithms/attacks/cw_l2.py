import torch
import torch.nn.functional as F 
from .base import BaseAttack


class CWL2Attack(BaseAttack):
    """Carlini & Wagner L2攻击

    参数:
        confidence (float): 对抗样本置信度（越高表示攻击越强）
        steps (int): 优化迭代次数
        lr (float): 攻击学习率
        initial_const (float): 初始权衡常数c
        input_size (int or None): 若非None，攻击前会将图像缩放至(input_size,input_size)避免YOLO头尺寸不匹配
    """

    def __init__(self, confidence=0, steps=1000, lr=0.01, initial_const=0.1, input_size=640):
        super().__init__(name="cw_l2")
        self.confidence = confidence  # 控制攻击强度的置信度阈值
        self.steps = steps  # 优化步数（FGSM只有1步）
        self.lr = lr  # 优化器学习率
        self.initial_const = initial_const  # 损失函数权衡系数
        self.input_size = input_size  # YOLO标准输入尺寸
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    def attack(self, model, images, targets=None, **kwargs):
        """生成C&W L2对抗样本

        参数:
            model: Ultralytics YOLO模型
            images (torch.Tensor): [0,1]范围的图像张量 (B,C,H,W)
            targets: 未使用（保持与FGSM接口一致）

        返回:
            与输入同形状的对抗样本张量
        """
        # 1. 预处理 
        images = images.clone().detach().to(self.device)
        orig_size = images.shape[-2:]  # 保存原始尺寸(H,W)

        # 统一缩放到标准尺寸
        if self.input_size is not None and orig_size != (self.input_size, self.input_size):
            images = F.interpolate(images, (self.input_size, self.input_size),
                                   mode='bilinear', align_corners=False)

        # 2. 初始化优化变量 
        modifier = torch.zeros_like(images, requires_grad=True).to(self.device)
        optimizer = torch.optim.Adam([modifier], lr=self.lr) 

        # 权衡系数
        const = torch.ones(images.size(0)).to(self.device) * self.initial_const
        const = const.requires_grad_(True)

        # 记录最佳结果
        best_adv = images.clone().detach()
        best_loss = torch.ones(images.size(0)).to(self.device) * float('inf')

        # 3. 模型设置 
        model.model.to(self.device).eval()  

        # 4. 迭代攻击 
        for step in range(self.steps):
            adv_images = torch.clamp(images + modifier, 0, 1)  # 确保图像在[0,1]范围

            # 获取YOLO预测结果（取第一个头的输出）
            preds = model.model(adv_images)
            if isinstance(preds, (list, tuple)):
                preds = preds[0]  # 多尺度输出时取第一个预测头

            # 核心攻击目标：最小化目标分数（这里攻击objectness置信度）
            obj_conf = preds[..., 4].mean()  # 取所有anchor的objectness均值

            # C&W损失函数 = L2扰动大小 + c*攻击成功项
            l2_dist = torch.norm(modifier.view(modifier.size(0), -1), p=2, dim=1)
            attack_loss = torch.clamp(obj_conf - self.confidence, min=0)  # 当obj_conf>confidence时才惩罚
            total_loss = l2_dist + const * attack_loss

            # 更新最佳对抗样本
            for i in range(images.size(0)):
                if total_loss[i] < best_loss[i]:
                    best_loss[i] = total_loss[i]
                    best_adv[i] = adv_images[i]

            # 反向传播优化
            optimizer.zero_grad()
            if const.grad is not None:
                const.grad.zero_()
            total_loss.sum().backward()
            optimizer.step()

            # 动态调整常数c（当攻击失败时增大c）
            with torch.no_grad():
                const += self.lr * (attack_loss.detach() > 0).float()

        # 5. 后处理 
        if self.input_size is not None and best_adv.shape[-2:] != orig_size:
            best_adv = F.interpolate(best_adv, orig_size, mode='bilinear', align_corners=False)

        return best_adv.detach()  # 返回效果最好的对抗样本

Attack = CWL2Attack
