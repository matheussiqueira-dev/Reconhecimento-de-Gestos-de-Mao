from camera_utils import default_backend, probe_cameras

def check_cameras():
    print("Checking for available cameras...")
    probe_indices = list(range(8))
    infos = probe_cameras(probe_indices, backend=default_backend())
    available_indices = [info.index for info in infos if info.working]

    for info in infos:
        label = "OK" if info.working else "NO"
        name = f" - {info.name}" if info.name else ""
        print(f"[{label}] Camera index {info.index}{name}")

    if not available_indices:
        print("\nNo working cameras found.")
    else:
        print(f"\nWorking cameras found at indices: {available_indices}")

if __name__ == "__main__":
    check_cameras()
