import setup_path  # adds AirSim Python client to path
import airsim
import argparse
import time


def simple_flight(client: airsim.MultirotorClient, altitude: float, velocity: float):
    """Fly four way-points in a square then return home."""
    # way-points in NED coordinates (x, y, z). Negative z is up.
    z = -abs(altitude)
    waypoints = [
        (10, 0, z),
        (10, 10, z),
        (0, 10, z),
        (0, 0, z),
    ]

    for wp in waypoints:
        print(f"Flying to waypoint: {wp}")
        client.moveToPositionAsync(*wp, velocity=velocity).join()
        time.sleep(1)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Demo: takeoff, fly square, return-to-home (RTH)")
    parser.add_argument("--altitude", type=float, default=4, help="Cruise altitude in meters (positive)")
    parser.add_argument("--velocity", type=float, default=3, help="Cruise speed in m/s")
    args = parser.parse_args()

    # connect
    client = airsim.MultirotorClient()
    client.confirmConnection()
    client.enableApiControl(True)
    client.armDisarm(True)

    print("Taking off ...")
    client.takeoffAsync().join()

    # ensure altitude
    client.moveToZAsync(-abs(args.altitude), 1).join()

    # fly square path
    simple_flight(client, args.altitude, args.velocity)

    # automatic return to home & land
    # teleport instantly to origin (ignore collisions in case we are stuck)
    print("Instantly teleporting to origin ...")
    home_pose = airsim.Pose(airsim.Vector3r(0, 0, -abs(args.altitude)),
                            airsim.to_quaternion(0, 0, 0))
    client.simSetVehiclePose(home_pose, ignore_collison=True)
    time.sleep(1)
    # now perform a normal land for safety
    client.landAsync().join()

    # disarm & release control
    client.armDisarm(False)
    client.enableApiControl(False)
    print("Done.") 