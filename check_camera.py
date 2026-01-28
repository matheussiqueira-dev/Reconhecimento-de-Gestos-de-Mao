from camera_utils import list_working_cameras

def check_cameras():
    print("Checking for available cameras...")
    probe_indices = list(range(5))
    available_indices = list_working_cameras(probe_indices)
    for i in probe_indices:
        if i in available_indices:
            print(f"Camera found at index {i}")
        else:
            print(f"No camera at index {i}")
            
    if not available_indices:
        print("\nNo working cameras found.")
    else:
        print(f"\nWorking cameras found at indices: {available_indices}")

if __name__ == "__main__":
    check_cameras()
