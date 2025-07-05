from abc import ABC, abstractmethod

class BaseDefense(ABC):
    """所有防御算法的基类"""
    
    def __init__(self, name):
        self.name = name
    
    @abstractmethod
    def defend(self, images, **kwargs):
        """
        执行防御
        
        参数:
            images: 输入图像 (可能是对抗样本)
            **kwargs: 额外参数
            
        返回:
            处理后的图像
        """
        pass
    
    def __call__(self, images, **kwargs):
        """使对象可调用"""
        return self.defend(images, **kwargs)


class BaseTrainingDefense(ABC):
    """所有基于训练的防御算法的基类"""
    
    def __init__(self, name):
        self.name = name
    
    @abstractmethod
    def train(self, model, dataloader, optimizer, epochs, **kwargs):
        """
        执行防御训练
        
        参数:
            model: 要训练的模型
            dataloader: 训练数据加载器
            optimizer: 优化器
            epochs: 训练轮数
            **kwargs: 额外参数
            
        返回:
            训练后的模型
        """
        pass