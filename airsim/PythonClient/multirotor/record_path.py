# save as record_path.py
import setup_path, airsim, time, csv

INTERVAL = 0.2           # 采样间隔 (s)
FILENAME = "road_path.csv"

client = airsim.MultirotorClient()
client.confirmConnection()
client.enableApiControl(True)
client.armDisarm(True)
client.takeoffAsync().join()

print("[INFO] 开始手动飞行采点，Ctrl+C 结束…")
with open(FILENAME, "w", newline="") as f:
    writer = csv.writer(f)
    try:
        while True:
            pos = client.getMultirotorState().kinematics_estimated.position
            writer.writerow([pos.x_val, pos.y_val, pos.z_val])
            print(f"x={pos.x_val:.1f}, y={pos.y_val:.1f}, z={pos.z_val:.1f}")
            time.sleep(INTERVAL)
    except KeyboardInterrupt:
        pass

client.hoverAsync().join()
client.landAsync().join()
client.armDisarm(False)
client.enableApiControl(False)
print(f"[INFO] 采样完成，已保存到 {FILENAME}")