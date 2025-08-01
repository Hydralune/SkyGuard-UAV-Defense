import setup_path           # 确保 AirSim 的 Python 路径已加入
import airsim
import time
import math

"""
complex_flight.py
-----------------
演示一个更复杂的多旋翼飞行流程：
1. 起飞并在 10 m 高度执行一个正方形巡航
2. 升高到 20 m
3. 做一次 360° 旋转（全景扫描）
4. 在空中飞一个“8”字形
5. 降落并解除控制

注意：AirSim 使用 NED 坐标系（Z 轴为负表示向上）。
"""

def create_square_path(side_len: float, z: float):
    """生成一个以原点为起点，顺时针方向的正方形路径。"""
    return [
        airsim.Vector3r(side_len, 0, z),
        airsim.Vector3r(side_len, side_len, z),
        airsim.Vector3r(0, side_len, z),
        airsim.Vector3r(0, 0, z),
    ]

def create_figure_eight(radius: float, points: int, z: float):
    """生成一个中心在原点的光滑 8 字形轨迹（Gerono 引线形）。"""
    path = []
    for i in range(points):
        theta = 2 * math.pi * i / points      # 0 → 2π
        x = radius * math.sin(theta)
        y = radius * math.sin(theta) * math.cos(theta)
        path.append(airsim.Vector3r(x, y, z))
    return path

if __name__ == "__main__":
    # --------------------------------------------------------------
    # 连接并解锁
    # --------------------------------------------------------------
    client = airsim.MultirotorClient()
    client.confirmConnection()
    client.enableApiControl(True)
    print("[INFO] 解锁...")
    client.armDisarm(True)

    state = client.getMultirotorState()
    if state.landed_state == airsim.LandedState.Landed:
        print("[INFO] 正在起飞...")
        client.takeoffAsync().join()
    else:
        client.hoverAsync().join()

    # --------------------------------------------------------------
    # 1. 10 m 高度正方形巡航
    # --------------------------------------------------------------
    z_square = -10           # NED：负值表示向上
    print(f"[INFO] 上升到 {abs(z_square)} m ...")
    client.moveToZAsync(z_square, 2).join()

    square_side = 20         # 边长 20 m
    print("[INFO] 执行正方形路径...")
    square_path = create_square_path(square_side, z_square)
    client.moveOnPathAsync(
        square_path,
        velocity=5,
        timeout_sec=120,
        drivetrain=airsim.DrivetrainType.ForwardOnly,
        yaw_mode=airsim.YawMode(False, 0),
        lookahead=-1,
        adaptive_lookahead=1,
    ).join()

    # --------------------------------------------------------------
    # 2. 升高到 20 m
    # --------------------------------------------------------------
    z_high = -20
    print(f"[INFO] 上升到 {abs(z_high)} m ...")
    client.moveToPositionAsync(0, 0, z_high, 3).join()

    # --------------------------------------------------------------
    # 3. 360° 全景旋转
    # --------------------------------------------------------------
    print("[INFO] 开始 360° 全景旋转...")
    for yaw_deg in range(0, 361, 60):
        client.rotateToYawAsync(float(yaw_deg), margin=5).join()
        time.sleep(0.2)

    # --------------------------------------------------------------
    # 4. 空中 8 字形轨迹
    # --------------------------------------------------------------
    print("[INFO] 执行 8 字形轨迹...")
    fig8_path = create_figure_eight(radius=15, points=72, z=z_high)
    client.moveOnPathAsync(
        fig8_path,
        velocity=5,
        timeout_sec=180,
        drivetrain=airsim.DrivetrainType.ForwardOnly,
        yaw_mode=airsim.YawMode(False, 0),
        lookahead=-1,
        adaptive_lookahead=1,
    ).join()

    # --------------------------------------------------------------
    # 5. 降落并释放控制
    # --------------------------------------------------------------
    print("[INFO] 降落准备...")
    client.moveToPositionAsync(0, 0, -5, 2).join()

    print("[INFO] 正在降落...")
    client.landAsync().join()

    print("[INFO] 解锁并释放 API 控制。")
    client.armDisarm(False)
    client.enableApiControl(False)

    print("[INFO] 复杂飞行演示完成。")