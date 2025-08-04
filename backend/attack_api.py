# backend/attack_api.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, List, Any, Optional
import importlib
import inspect
import os
import sys

# 确保algorithms模块可以被导入
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

router = APIRouter(
    prefix="/api/attacks",
    tags=["attacks"],
    responses={404: {"description": "Not found"}},
)

class AttackParameter(BaseModel):
    """攻击算法参数模型"""
    name: str
    type: str
    description: str
    default: Any
    required: bool = False
    options: Optional[List[Any]] = None

class AttackInfo(BaseModel):
    """攻击算法信息模型"""
    id: str
    name: str
    description: str
    parameters: List[AttackParameter]

# 定义攻击算法的详细信息
ATTACK_DESCRIPTIONS = {
    "pgd": "投影梯度下降攻击 (Projected Gradient Descent)，一种迭代式白盒攻击方法，通过多步梯度更新生成对抗样本。",
    "fgsm": "快速梯度符号法 (Fast Gradient Sign Method)，一种单步白盒攻击方法，利用梯度信息快速生成对抗样本。",
    "cw_l2": "Carlini & Wagner L2攻击，一种优化式白盒攻击方法，通过求解优化问题生成高质量对抗样本。",
    "dpatch": "DPatch攻击，一种补丁式攻击方法，通过在图像上放置优化的补丁来欺骗目标检测器。",
    "brightness": "亮度干扰攻击，通过调整图像亮度来影响模型性能的简单攻击方法。",
    "gaussian": "高斯噪声攻击，通过向图像添加高斯噪声来干扰模型预测的简单攻击方法。",
    "contrast": "对比度调整攻击，通过改变图像对比度来影响模型性能的简单攻击方法。",
    "deepfool": "DeepFool攻击，一种迭代式白盒攻击方法，通过计算决策边界的最近距离来生成对抗样本。",
    "advpatch": "AdvPatch攻击，一种通用补丁攻击方法，支持多位置放置和随机位置的补丁优化。",
    "distortion": "图像扭曲攻击，通过对图像应用各种扭曲变换（如弹性变形、波浪变形等）来生成对抗样本。",
    "scene_transition": "场景跃变攻击，通过模拟场景突变（如天气变化、光照变化、视角变化等）来测试模型鲁棒性。"
}

# 定义每种攻击算法的参数信息
ATTACK_PARAMETERS = {
    "pgd": [
        AttackParameter(name="eps", type="float", description="最大扰动幅度 (例如: 8/255)", default="8/255", required=True),
        AttackParameter(name="alpha", type="float", description="单步扰动大小 (例如: 2/255)", default="2/255", required=True),
        AttackParameter(name="steps", type="int", description="迭代步数", default=10, required=True)
    ],
    "fgsm": [
        AttackParameter(name="eps", type="float", description="扰动幅度 (例如: 8/255)", default="8/255", required=True),
        AttackParameter(name="steps", type="int", description="迭代步数", default=1, required=False)
    ],
    "cw_l2": [
        AttackParameter(name="confidence", type="float", description="置信度参数", default=0, required=False),
        AttackParameter(name="steps", type="int", description="优化步数", default=10, required=True),
        AttackParameter(name="lr", type="float", description="学习率", default=0.01, required=True),
        AttackParameter(name="initial_const", type="float", description="初始常数c", default=0.1, required=False)
    ],
    "dpatch": [
        AttackParameter(name="patch_size", type="int", description="补丁大小（像素）", default=30, required=True),
        AttackParameter(name="steps", type="int", description="优化步数", default=10, required=True)
    ],
    "brightness": [
        AttackParameter(name="brightness_factor", type="float", description="亮度调整因子（>1增亮，<1变暗）", default=1.5, required=True)
    ],
    "gaussian": [
        AttackParameter(name="noise_std", type="float", description="噪声标准差", default=0.1, required=True)
    ],
    "contrast": [
        AttackParameter(name="contrast_factor", type="float", description="对比度调整因子（>1增加对比度，<1降低对比度）", default=1.5, required=True)
    ],
    "deepfool": [
        AttackParameter(name="max_iter", type="int", description="最大迭代次数", default=50, required=True),
        AttackParameter(name="overshoot", type="float", description="越过决策边界的程度", default=0.02, required=False)
    ],
    "advpatch": [
        AttackParameter(name="patch_size", type="float", description="补丁大小（像素或0-1之间的比例）", default=0.1, required=True),
        AttackParameter(name="learning_rate", type="float", description="补丁优化的学习率", default=0.1, required=True),
        AttackParameter(name="max_iter", type="int", description="最大优化迭代次数", default=100, required=True),
        AttackParameter(name="random_locations", type="bool", description="是否在随机位置放置补丁", default=True, required=False),
        AttackParameter(name="num_patches", type="int", description="放置的补丁数量", default=1, required=False)
    ],
    "distortion": [
        AttackParameter(name="distortion_type", type="string", description="扭曲类型", default="elastic", required=True, 
                       options=["elastic", "wave", "swirl"]),
        AttackParameter(name="severity", type="float", description="扭曲严重程度 (0.0-1.0)", default=0.5, required=True)
    ],
    "scene_transition": [
        AttackParameter(name="transition_type", type="string", description="跃变类型", default="weather", required=True,
                       options=["weather", "lighting", "blur"]),
        AttackParameter(name="severity", type="float", description="跃变严重程度 (0.0-1.0)", default=0.5, required=True)
    ]
}

def get_available_attacks() -> List[AttackInfo]:
    """获取所有可用的攻击算法信息"""
    attacks = []
    
    # 遍历预定义的攻击算法
    for attack_id, description in ATTACK_DESCRIPTIONS.items():
        # 获取参数信息
        parameters = ATTACK_PARAMETERS.get(attack_id, [])
        
        # 创建攻击信息对象
        attack_info = AttackInfo(
            id=attack_id,
            name=attack_id.upper(),
            description=description,
            parameters=parameters
        )
        
        attacks.append(attack_info)
    
    return attacks

@router.get("/", response_model=List[AttackInfo])
async def list_attacks():
    """获取所有可用的攻击算法及其参数信息"""
    return get_available_attacks()

@router.get("/{attack_id}", response_model=AttackInfo)
async def get_attack_info(attack_id: str):
    """获取特定攻击算法的详细信息"""
    if attack_id not in ATTACK_DESCRIPTIONS:
        raise HTTPException(status_code=404, detail=f"攻击算法 {attack_id} 不存在")
    
    # 获取参数信息
    parameters = ATTACK_PARAMETERS.get(attack_id, [])
    
    # 创建攻击信息对象
    attack_info = AttackInfo(
        id=attack_id,
        name=attack_id.upper(),
        description=ATTACK_DESCRIPTIONS[attack_id],
        parameters=parameters
    )
    
    return attack_info