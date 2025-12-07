import cv2

def check_cameras():
    print("Checking for available cameras...")
    available_indices = []
    for i in range(5):
        cap = cv2.VideoCapture(i)
        if cap.isOpened():
            ret, frame = cap.read()
            if ret:
                print(f"Camera found at index {i}")
                available_indices.append(i)
            else:
                print(f"Camera opened at index {i} but failed to read frame.")
            cap.release()
        else:
            print(f"No camera at index {i}")
            
    if not available_indices:
        print("\nNo working cameras found.")
    else:
        print(f"\nWorking cameras found at indices: {available_indices}")

if __name__ == "__main__":
    check_cameras()
