import torch
from .base import BaseAttack

class FGSMAttack(BaseAttack):
    """Fast Gradient Sign Method (FGSM) for YOLO models.

    Args:
        eps (float): Maximum perturbation (e.g. 8/255).
        steps (int): Number of steps for the attack.
        input_size (int or None): If not None, images will be resized to square input_size before attack
            to avoid mismatch with YOLO detection heads. After attack, images will be resized back.
    """

    def __init__(self, eps=8/255, steps=1, input_size=640):
        super().__init__(name="fgsm")
        self.eps = eps
        self.steps = steps
        self.alpha = eps
        self.input_size = input_size
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    # Alias so load_attack can find the class even if different name
    # (AdversarialEvaluator's dynamic loader looks for subclass of BaseAttack)

    def attack(self, model, images, targets=None, **kwargs):
        """Generate adversarial examples using FGSM.

        Args:
            model: Ultralytics YOLO model (wrapped by YOLO from ultralytics).
            images (torch.Tensor): Input images in range [0,1] with shape (B,C,H,W).
            targets: Not used.
        Returns:
            torch.Tensor with same shape as `images` containing adversarial examples.
        """
        images = images.clone().detach().to(self.device)
        orig_size = images.shape[-2:]
        if self.input_size is not None and orig_size != (self.input_size, self.input_size):
            images = torch.nn.functional.interpolate(images, size=(self.input_size, self.input_size), mode="bilinear", align_corners=False)

        ori_images = images.clone().detach()
        images.requires_grad = True

        # Ensure model on correct device
        model.model.to(self.device)
        model.model.eval()

        preds = model.model(images)
        if isinstance(preds, (list, tuple)):
            preds = preds[0]
        obj_conf = preds[..., 4]  # objectness score
        loss = -obj_conf.mean()

        model.model.zero_grad()
        if images.grad is not None:
            images.grad.zero_()
        loss.backward()

        grad_sign = images.grad.data.sign()
        adv_images = images.detach() + self.eps * grad_sign
        adv_images = torch.clamp(adv_images, 0, 1)

        # Resize back if needed
        if self.input_size is not None and adv_images.shape[-2:] != orig_size:
            adv_images = torch.nn.functional.interpolate(adv_images, size=orig_size, mode="bilinear", align_corners=False)

        return adv_images

# For backward compatibility import style
Attack = FGSMAttack 