from .base import BaseTrainingDefense
from algorithms.gen_af.standard_finetuning import main as genaf_train

class GenAFDefense(BaseTrainingDefense):
    """基于Gen-AF算法的防御（集成自Gen-AF）"""
    def __init__(self):
        super().__init__(name="genaf_defense")

    def train(self, model, dataloader, optimizer, epochs, **kwargs):
        
        # 直接调用Gen-AF训练主流程
        genaf_train()
        return model

# 兼容主流程的注册
Defense = GenAFDefense
