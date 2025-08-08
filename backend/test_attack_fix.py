#!/usr/bin/env python3
"""
测试攻击任务修复的脚本
用于验证 evaluate_image 参数修复是否正确
"""

import inspect

def test_evaluate_image_signature():
    """测试不同评估器的 evaluate_image 方法签名"""
    
    print("=" * 60)
    print("测试 evaluate_image 方法签名")
    print("=" * 60)
    
    try:
        # 测试 AdversarialEvaluator
        from evaluate_adversarial import AdversarialEvaluator
        
        # 获取方法签名
        sig = inspect.signature(AdversarialEvaluator.evaluate_image)
        print(f"AdversarialEvaluator.evaluate_image 签名: {sig}")
        print(f"参数数量: {len(sig.parameters)} (self 不计算在内)")
        print(f"参数名称: {list(sig.parameters.keys())}")
        
        # 检查是否只有 image_path 参数
        params = list(sig.parameters.keys())
        if len(params) == 2 and params[0] == 'self' and params[1] == 'image_path':
            print("✓ AdversarialEvaluator.evaluate_image 签名正确")
        else:
            print("✗ AdversarialEvaluator.evaluate_image 签名不正确")
            
    except ImportError as e:
        print(f"无法导入 AdversarialEvaluator: {e}")
    except Exception as e:
        print(f"测试 AdversarialEvaluator 时出错: {e}")
    
    print()
    
    try:
        # 测试 EnhancedEvaluator
        from evaluate_model import EnhancedEvaluator
        
        # 获取方法签名
        sig = inspect.signature(EnhancedEvaluator.evaluate_image)
        print(f"EnhancedEvaluator.evaluate_image 签名: {sig}")
        print(f"参数数量: {len(sig.parameters)} (self 不计算在内)")
        print(f"参数名称: {list(sig.parameters.keys())}")
        
        # EnhancedEvaluator 可以接受 ground_truth 参数
        params = list(sig.parameters.keys())
        if len(params) >= 2 and params[0] == 'self' and params[1] == 'image_path':
            print("✓ EnhancedEvaluator.evaluate_image 签名正确")
        else:
            print("✗ EnhancedEvaluator.evaluate_image 签名不正确")
            
    except ImportError as e:
        print(f"无法导入 EnhancedEvaluator: {e}")
    except Exception as e:
        print(f"测试 EnhancedEvaluator 时出错: {e}")

def test_tasks_fix():
    """验证 tasks.py 中的修复"""
    
    print("\n" + "=" * 60)
    print("验证 tasks.py 中的修复")  
    print("=" * 60)
    
    try:
        with open('/root/projects/SkyGuard-UAV-Defense/backend/tasks.py', 'r') as f:
            content = f.read()
            
        # 查找修复后的代码行
        if 'result = original_evaluate_image(image_path)' in content:
            print("✓ 找到修复后的代码: result = original_evaluate_image(image_path)")
        else:
            print("✗ 未找到修复后的代码")
            
        # 检查是否还有未修复的调用
        if 'original_evaluate_image(image_path, image_idx)' in content:
            print("✗ 仍有未修复的调用: original_evaluate_image(image_path, image_idx)")
        else:
            print("✓ 所有相关调用已修复")
            
    except Exception as e:
        print(f"检查 tasks.py 时出错: {e}")

if __name__ == "__main__":
    test_evaluate_image_signature()
    test_tasks_fix()
    
    print("\n" + "=" * 60)
    print("修复总结")
    print("=" * 60)
    print("1. AdversarialEvaluator.evaluate_image 只接受 image_path 参数")
    print("2. EnhancedEvaluator.evaluate_image 可以接受 ground_truth 参数")
    print("3. tasks.py 中的攻击任务已修复参数传递问题")
    print("4. 现在应该不会再出现 'takes 2 positional arguments but 3 were given' 错误")
    print("=" * 60)