import setup_path
import airsim
import time

# 1. 连接 & 起飞 ----------------------------------------------------
client = airsim.MultirotorClient()
client.confirmConnection()
client.enableApiControl(True)
client.armDisarm(True)

if client.getMultirotorState().landed_state == airsim.LandedState.Landed:
    client.takeoffAsync().join()
else:
    client.hoverAsync().join()

# 2. 升到目标高度（例如 5 m） --------------------------------------
z = -5             # NED：-5 表示离地 5 m
client.moveToZAsync(z, 2).join()

# 3. 定义道路中心线坐标 --------------------------------------------
#    ▶ 用你自己采的点替换下面列表
waypoints = [
    airsim.Vector3r(160, -1500, z),
    airsim.Vector3r(160, -1350, z),
    airsim.Vector3r( 10, -1350, z),
    airsim.Vector3r( 10, -1150, z),
    airsim.Vector3r(-140, -1150, z),
    airsim.Vector3r(-140,  -950, z),
]

# 4. 沿道路飞行 ------------------------------------------------------
print("[INFO] Start street flight…")
client.moveOnPathAsync(
    waypoints,             # 路径点
    velocity=6,            # m/s
    timeout_sec=300,       # 超时
    drivetrain=airsim.DrivetrainType.ForwardOnly,
    yaw_mode=airsim.YawMode(False, 0),  # 机头顺着航向
    lookahead=-1,
    adaptive_lookahead=1
).join()

# 5. 降落 & 释放控制 -------------------------------------------------
client.moveToZAsync(-2, 2).join()
client.landAsync().join()
client.armDisarm(False)
client.enableApiControl(False)
print("[INFO] Flight finished.")