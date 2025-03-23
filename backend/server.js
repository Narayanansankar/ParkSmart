import cv2
import numpy as np
import easyocr
import pytesseract
from ultralytics import YOLO
from paddleocr import PaddleOCR

# Load YOLO model for plate detection
model = YOLO("C:/Users/sanka/Downloads/weights (2).pt")

# Initialize OCR models
easyocr_reader = easyocr.Reader(['en'])
paddle_ocr = PaddleOCR()

# Configure Tesseract
pytesseract.pytesseract.tesseract_cmd = r"C:/Program Files/Tesseract-OCR/tesseract.exe"

# OCR Preprocessing
def preprocess_for_ocr(plate_img):
    gray = cv2.cvtColor(plate_img, cv2.COLOR_BGR2GRAY)
    gray = cv2.resize(gray, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)
    _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    return thresh

# Character Correction
def correct_plate_text(text):
    corrections = {'4': 'A', '0': 'O', '1': 'I', '5': 'S', '8': 'B', '7': 'T', '2': 'Z'}
    return ''.join(corrections.get(c, c) for c in text)

cap = cv2.VideoCapture(0)

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break

    results = model.predict(frame, conf=0.5)

    if results and results[0].boxes is not None:
        for box in results[0].boxes.xyxy.tolist():
            x1, y1, x2, y2 = map(int, box[:4])
            plate_img = frame[y1:y2, x1:x2]

            if plate_img.size == 0:
                continue

            processed_plate = preprocess_for_ocr(plate_img)

            # EasyOCR
            easyocr_text = easyocr_reader.readtext(processed_plate, detail=0)
            easyocr_text = ''.join(easyocr_text).upper()

            # Tesseract OCR
            tess_text = pytesseract.image_to_string(processed_plate, config='--psm 7')
            tess_text = ''.join(filter(str.isalnum, tess_text)).upper()
            tess_text = correct_plate_text(tess_text)

            # PaddleOCR
            paddle_results = paddle_ocr.ocr(processed_plate, cls=True)
            paddle_text = ''.join([res[1][0] for line in paddle_results for res in line]).upper()

            # Choose the best OCR result
            ocr_candidates = [easyocr_text, tess_text, paddle_text]
            final_text = max(ocr_candidates, key=len)

            if final_text:
                print(f"Detected Plate: {final_text}")
                cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
                cv2.putText(frame, final_text, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)

    cv2.imshow("License Plate Detection", frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
