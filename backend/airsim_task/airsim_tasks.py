import setup_path
import airsim
import numpy as np
import os
import tempfile
import pprint
import cv2
from uuid import uuid4
# 移除shared_task导入
# from celery import shared_task
import time
import json
from pathlib import Path

# 创建结果保存目录
def ensure_result_dir(task_id):
    result_dir = os.path.join("results", "airsim_results", task_id)
    os.makedirs(result_dir, exist_ok=True)
    return result_dir

# 任务状态常量
TASK_STATUS = {
    "PENDING": "pending",     # 等待执行
    "CONNECTED": "connected", # 已连接到AirSim
    "READY": "ready",         # 准备起飞
    "FLYING": "flying",       # 正在飞行
    "HOVERING": "hovering",   # 悬停中
    "IMAGING": "imaging",     # 拍摄图像中
    "COMPLETED": "completed", # 任务完成
    "FAILED": "failed"        # 任务失败
}

# 移除@shared_task装饰器
def drone_mission_task(task_id=None, ip="172.21.208.1", port=41451, step=None):
    """
    无人机任务执行函数，支持分步执行
    
    参数:
        task_id: 任务ID，如果为None则自动生成
        ip: AirSim服务器IP地址
        port: AirSim服务器端口
        step: 执行步骤，可选值: 
            - "connect": 连接到AirSim
            - "takeoff": 起飞
            - "move": 移动到指定位置
            - "image": 拍摄图像
            - "reset": 重置无人机状态
            - "all": 执行所有步骤（默认）
            - "demo": 执行完整演示流程
    """
    if task_id is None:
        task_id = str(uuid4())
    
    result_dir = ensure_result_dir(task_id)
    status_file = os.path.join(result_dir, "status.json")
    
    # 初始化或加载任务状态
    if os.path.exists(status_file):
        with open(status_file, "r") as f:
            status = json.load(f)
    else:
        status = {
            "task_id": task_id,
            "status": TASK_STATUS["PENDING"],
            "steps_completed": [],
            "current_step": "",
            "error": None,
            "images": [],
            "position": None,
            "last_update": time.time()
        }
    
    # 更新状态函数
    def update_status(status_key, current_step="", error=None, **kwargs):
        status["status"] = status_key
        status["current_step"] = current_step
        status["last_update"] = time.time()
        
        if current_step and current_step not in status["steps_completed"] and status_key != TASK_STATUS["FAILED"]:
            status["steps_completed"].append(current_step)
            
        if error:
            status["error"] = str(error)
            
        # 更新其他状态字段
        for key, value in kwargs.items():
            status[key] = value
            
        # 保存状态到文件
        with open(status_file, "w") as f:
            json.dump(status, f, indent=2)
        
        # 不再需要更新Celery任务状态，因为我们没有使用bind=True
        # self.update_state(
        #     state='PROGRESS',
        #     meta={
        #         'status': status["status"],
        #         'steps_completed': status["steps_completed"],
        #         'current_step': status["current_step"],
        #         'error': status["error"],
        #         'images': status["images"],
        #         'position': status["position"]
        #     }
        # )
        
        return status
    
    # 如果是演示模式或未指定步骤，则执行完整流程
    if step is None or step == "demo" or step == "all":
        try:
            print(f"开始执行完整无人机演示流程，IP: {ip}, 端口: {port}")
            
            # 1. 连接到AirSim
            update_status(TASK_STATUS["PENDING"], "connect")
            client = airsim.MultirotorClient(ip=ip, port=port)
            client.confirmConnection()
            client.enableApiControl(True)
            
            # 获取无人机状态
            state = client.getMultirotorState()
            s = pprint.pformat(state)
            print(f"无人机状态: {s}")
            
            # 获取传感器数据
            imu_data = client.getImuData()
            print(f"IMU数据: {pprint.pformat(imu_data)}")
            
            barometer_data = client.getBarometerData()
            print(f"气压计数据: {pprint.pformat(barometer_data)}")
            
            magnetometer_data = client.getMagnetometerData()
            print(f"磁力计数据: {pprint.pformat(magnetometer_data)}")
            
            gps_data = client.getGpsData()
            print(f"GPS数据: {pprint.pformat(gps_data)}")
            
            # 更新连接状态
            position = state.kinematics_estimated.position
            position_dict = {"x": position.x_val, "y": position.y_val, "z": position.z_val}
            update_status(TASK_STATUS["CONNECTED"], "connect", position=position_dict)
            print("连接成功，准备起飞")
            
            # 2. 起飞
            update_status(TASK_STATUS["READY"], "takeoff")
            print("正在起飞...")
            client.armDisarm(True)
            client.takeoffAsync().join()
            
            # 获取起飞后状态
            state = client.getMultirotorState()
            print(f"起飞后状态: {pprint.pformat(state)}")
            
            # 更新起飞状态
            position = state.kinematics_estimated.position
            position_dict = {"x": position.x_val, "y": position.y_val, "z": position.z_val}
            update_status(TASK_STATUS["FLYING"], "takeoff", position=position_dict)
            print("起飞完成，准备移动")
            
            # 3. 移动到指定位置
            update_status(TASK_STATUS["FLYING"], "move")
            print("正在移动到位置 (-10, 10, -10)，速度 5 m/s")
            client.moveToPositionAsync(-10, 10, -10, 5).join()
            client.hoverAsync().join()
            
            # 获取移动后状态
            state = client.getMultirotorState()
            print(f"移动后状态: {pprint.pformat(state)}")
            
            # 更新移动状态
            position = state.kinematics_estimated.position
            position_dict = {"x": position.x_val, "y": position.y_val, "z": position.z_val}
            update_status(TASK_STATUS["HOVERING"], "move", position=position_dict)
            print("移动完成，准备拍摄图像")
            
            # 4. 拍摄图像
            update_status(TASK_STATUS["IMAGING"], "image")
            print("正在拍摄图像...")
            
            # 获取相机图像
            responses = client.simGetImages([
                airsim.ImageRequest("0", airsim.ImageType.DepthVis),
                airsim.ImageRequest("1", airsim.ImageType.DepthPerspective, True),
                airsim.ImageRequest("1", airsim.ImageType.Scene),
                airsim.ImageRequest("1", airsim.ImageType.Scene, False, False)
            ])
            print(f"获取到 {len(responses)} 张图像")
            
            # 保存图像
            image_paths = []
            for idx, response in enumerate(responses):
                image_filename = f"image_{idx}.png"
                image_path = os.path.join(result_dir, image_filename)
                
                if response.pixels_as_float:
                    print(f"图像 {idx}: 类型 {response.image_type}, 大小 {len(response.image_data_float)}")
                    airsim.write_pfm(os.path.normpath(image_path.replace(".png", ".pfm")), 
                                    airsim.get_pfm_array(response))
                    image_paths.append(image_path.replace(".png", ".pfm"))
                elif response.compress:
                    print(f"图像 {idx}: 类型 {response.image_type}, 大小 {len(response.image_data_uint8)}")
                    airsim.write_file(os.path.normpath(image_path), response.image_data_uint8)
                    image_paths.append(image_path)
                else:
                    print(f"图像 {idx}: 类型 {response.image_type}, 大小 {len(response.image_data_uint8)}")
                    img1d = np.fromstring(response.image_data_uint8, dtype=np.uint8)
                    img_rgb = img1d.reshape(response.height, response.width, 3)
                    cv2.imwrite(os.path.normpath(image_path), img_rgb)
                    image_paths.append(image_path)
            
            # 更新相对路径，便于前端访问
            relative_image_paths = [os.path.relpath(p, "results") for p in image_paths]
            
            # 获取无人机状态
            state = client.getMultirotorState()
            position = state.kinematics_estimated.position
            position_dict = {"x": position.x_val, "y": position.y_val, "z": position.z_val}
            
            update_status(
                TASK_STATUS["HOVERING"], 
                "image", 
                position=position_dict,
                images=relative_image_paths
            )
            print("图像拍摄完成，准备重置")
            
            # 5. 重置无人机状态
            update_status(TASK_STATUS["FLYING"], "reset")
            print("正在重置无人机...")
            client.reset()
            client.armDisarm(False)
            client.enableApiControl(False)
            
            update_status(TASK_STATUS["COMPLETED"], "reset")
            print("演示完成！")
            
            # 返回完整结果
            return {
                "task_id": task_id,
                "status": status["status"],
                "steps_completed": status["steps_completed"],
                "position": status["position"],
                "images": status["images"],
                "message": "无人机演示任务完成"
            }
            
        except Exception as e:
            error_msg = f"演示过程中出错: {str(e)}"
            print(error_msg)
            update_status(TASK_STATUS["FAILED"], error=error_msg)
            raise e
    
    # 分步执行的逻辑保持不变
    # 尝试执行请求的步骤
    try:
        client = None
        
        # 步骤1: 连接到AirSim
        if step == "connect" and "connect" not in status["steps_completed"]:
            update_status(TASK_STATUS["PENDING"], "connect")
            
            try:
                client = airsim.MultirotorClient(ip=ip, port=port)
                client.confirmConnection()
                client.enableApiControl(True)
                
                # 获取无人机状态
                state = client.getMultirotorState()
                position = state.kinematics_estimated.position
                position_dict = {"x": position.x_val, "y": position.y_val, "z": position.z_val}
                
                update_status(
                    TASK_STATUS["CONNECTED"], 
                    "connect", 
                    position=position_dict
                )
                
                # 如果只执行连接步骤，则返回
                return {
                    "task_id": task_id,
                    "status": status["status"],
                    "steps_completed": status["steps_completed"],
                    "position": position_dict
                }
            except Exception as e:
                update_status(TASK_STATUS["FAILED"], "connect", error=str(e))
                raise e
        
        # 如果需要执行后续步骤但尚未连接，则先连接
        if step in ["takeoff", "move", "image", "reset"] and "connect" not in status["steps_completed"]:
            if client is None:
                try:
                    client = airsim.MultirotorClient(ip=ip, port=port)
                    client.confirmConnection()
                    client.enableApiControl(True)
                    
                    # 获取无人机状态
                    state = client.getMultirotorState()
                    position = state.kinematics_estimated.position
                    position_dict = {"x": position.x_val, "y": position.y_val, "z": position.z_val}
                    
                    update_status(
                        TASK_STATUS["CONNECTED"], 
                        "connect", 
                        position=position_dict
                    )
                except Exception as e:
                    update_status(TASK_STATUS["FAILED"], "connect", error=str(e))
                    raise e
        
        # 步骤2: 起飞
        if step == "takeoff" and "takeoff" not in status["steps_completed"]:
            update_status(TASK_STATUS["READY"], "takeoff")
            
            try:
                client.armDisarm(True)
                client.takeoffAsync().join()
                
                # 获取无人机状态
                state = client.getMultirotorState()
                position = state.kinematics_estimated.position
                position_dict = {"x": position.x_val, "y": position.y_val, "z": position.z_val}
                
                update_status(
                    TASK_STATUS["FLYING"], 
                    "takeoff", 
                    position=position_dict
                )
                
                # 如果只执行起飞步骤，则返回
                return {
                    "task_id": task_id,
                    "status": status["status"],
                    "steps_completed": status["steps_completed"],
                    "position": position_dict
                }
            except Exception as e:
                update_status(TASK_STATUS["FAILED"], "takeoff", error=str(e))
                raise e
        
        # 步骤3: 移动到指定位置
        if step == "move" and "move" not in status["steps_completed"]:
            update_status(TASK_STATUS["FLYING"], "move")
            
            try:
                # 移动到指定位置 (-10, 10, -10)，速度5m/s
                client.moveToPositionAsync(-10, 10, -10, 5).join()
                client.hoverAsync().join()
                
                # 获取无人机状态
                state = client.getMultirotorState()
                position = state.kinematics_estimated.position
                position_dict = {"x": position.x_val, "y": position.y_val, "z": position.z_val}
                
                update_status(
                    TASK_STATUS["HOVERING"], 
                    "move", 
                    position=position_dict
                )
                
                # 如果只执行移动步骤，则返回
                return {
                    "task_id": task_id,
                    "status": status["status"],
                    "steps_completed": status["steps_completed"],
                    "position": position_dict
                }
            except Exception as e:
                update_status(TASK_STATUS["FAILED"], "move", error=str(e))
                raise e
        
        # 步骤4: 拍摄图像
        if step == "image" and "image" not in status["steps_completed"]:
            update_status(TASK_STATUS["IMAGING"], "image")
            
            try:
                # 获取相机图像
                responses = client.simGetImages([
                    airsim.ImageRequest("0", airsim.ImageType.DepthVis),
                    airsim.ImageRequest("1", airsim.ImageType.DepthPerspective, True),
                    airsim.ImageRequest("1", airsim.ImageType.Scene),
                    airsim.ImageRequest("1", airsim.ImageType.Scene, False, False)
                ])
                
                # 保存图像
                image_paths = []
                for idx, response in enumerate(responses):
                    image_filename = f"image_{idx}.png"
                    image_path = os.path.join(result_dir, image_filename)
                    
                    if response.pixels_as_float:
                        airsim.write_pfm(os.path.normpath(image_path.replace(".png", ".pfm")), 
                                         airsim.get_pfm_array(response))
                        image_paths.append(image_path.replace(".png", ".pfm"))
                    elif response.compress:
                        airsim.write_file(os.path.normpath(image_path), response.image_data_uint8)
                        image_paths.append(image_path)
                    else:
                        img1d = np.fromstring(response.image_data_uint8, dtype=np.uint8)
                        img_rgb = img1d.reshape(response.height, response.width, 3)
                        cv2.imwrite(os.path.normpath(image_path), img_rgb)
                        image_paths.append(image_path)
                
                # 获取无人机状态
                state = client.getMultirotorState()
                position = state.kinematics_estimated.position
                position_dict = {"x": position.x_val, "y": position.y_val, "z": position.z_val}
                
                # 更新相对路径，便于前端访问
                relative_image_paths = [os.path.relpath(p, "results") for p in image_paths]
                
                update_status(
                    TASK_STATUS["HOVERING"], 
                    "image", 
                    position=position_dict,
                    images=relative_image_paths
                )
                
                # 如果只执行拍摄图像步骤，则返回
                return {
                    "task_id": task_id,
                    "status": status["status"],
                    "steps_completed": status["steps_completed"],
                    "position": position_dict,
                    "images": relative_image_paths
                }
            except Exception as e:
                update_status(TASK_STATUS["FAILED"], "image", error=str(e))
                raise e
        
        # 步骤5: 重置无人机状态
        if step == "reset" and "reset" not in status["steps_completed"]:
            update_status(TASK_STATUS["FLYING"], "reset")
            
            try:
                client.reset()
                client.armDisarm(False)
                client.enableApiControl(False)
                
                update_status(TASK_STATUS["COMPLETED"], "reset")
                
                # 如果只执行重置步骤，则返回
                return {
                    "task_id": task_id,
                    "status": status["status"],
                    "steps_completed": status["steps_completed"]
                }
            except Exception as e:
                update_status(TASK_STATUS["FAILED"], "reset", error=str(e))
                raise e
        
        # 如果没有指定步骤或步骤已完成，则返回当前状态
        return {
            "task_id": task_id,
            "status": status["status"],
            "steps_completed": status["steps_completed"],
            "position": status["position"],
            "images": status["images"]
        }
        
    except Exception as e:
        # 确保任何未捕获的异常都被记录
        if "status" in locals():
            update_status(TASK_STATUS["FAILED"], error=str(e))
        raise e
