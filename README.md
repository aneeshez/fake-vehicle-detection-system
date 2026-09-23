# Fake Vehicle Detection

Fake Vehicle Detection checks whether a vehicle seen by a camera is consistent with the vehicle registered to its number plate. The app reads the plate, looks it up in the project database, and compares the detected vehicle type and approximate color with the saved record.

It is a local project built with React, Django, and computer vision models. Its results are indicators for human review: a color or type mismatch does not prove that a vehicle is cloned or fraudulent.

## How it works

1. Start camera monitoring, capture one frame, or choose a saved image.
2. FastALPR detects the number plate and reads its text.
3. YOLO26n detects the vehicle type, while OpenCV estimates its broad color.
4. Django looks up the normalized plate and compares the visible vehicle details with its registration record.
5. The app reports a genuine match, a possible mismatch, a missing record, or a result that needs review. It logs recognized results and suppresses repeat detections for 30 seconds.

## Features

- Live camera monitoring and single-frame capture
- Still-image analysis
- Number-plate detection and OCR
- Registered-plate lookup and vehicle type/color comparison
- Result images and recent detection history
- Django Admin pages for vehicle records and event logs
- SQLite database for a simple local setup

## Technology

- **Frontend:** React, React Router, React Webcam, Axios
- **Backend:** Python, Django, Django Admin, Django ORM
- **Database:** SQLite by default
- **Vision:** FastALPR for plate detection and OCR, YOLO26n for vehicle detection, and OpenCV for image handling and color estimates

The old Flask API and Supabase setup are no longer used. Django migrations create the local database.

## Run on Windows

### Requirements

- Python 3.10 or newer
- Node.js and npm
- A camera, or a saved vehicle image

### Set up and start Django

```powershell
cd backend
py -m venv .venv
.venv\Scripts\Activate.ps1
Copy-Item .env.example .env
python -m pip install --upgrade pip
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

Django runs at `http://localhost:8000`. Sign in to `http://localhost:8000/admin/` and add vehicle records. Each record needs a unique number plate, a vehicle type (`car`, `motorcycle`, `bus`, or `truck`), and a color. Make/model and owner are optional. Simple color names such as `white`, `black`, `gray`, `red`, `blue`, `green`, `yellow`, or `orange` work best with the broad image-based estimate.

### Set up and start React

In a second terminal:

```powershell
cd frontend
npm install
npm start
```

Open `http://localhost:3000`, go to **Detect**, allow camera access, then choose **Start monitoring**. Use **Choose image** to analyze a saved image instead.

To connect to a Django API running at a different address, create `frontend/.env.local` with the matching API URL:

```text
REACT_APP_API_URL=http://localhost:8000/api
```

Restart React after changing environment settings.

## Django API

- `GET /api/health/` — API and vision-model loading state
- `POST /api/detect/` — analyze an image sent as `{ "image": "data:image/jpeg;base64,..." }`
- `GET /api/vehicles/` — list registered vehicles
- `GET /api/events/` — list recent detection events
- `/admin/` — manage vehicle records and review event logs

Vehicle records can be added through Django Admin by staff users.

## Vision model settings

The first detection downloads the configured model files and may take longer. The vehicle detector defaults to `yolo26n.pt`. You can change the model names in `backend/.env`:

```text
ALPR_DETECTOR_MODEL=yolo-v9-t-384-license-plate-end2end
ALPR_OCR_MODEL=cct-xs-v2-global-model
VEHICLE_MODEL=yolo26n.pt
```

## Contact form

The contact form sends email only when EmailJS is configured. Copy the optional `REACT_APP_EMAILJS_*` values from `frontend/.env.example` to `frontend/.env.local`, set up the corresponding EmailJS template, and restart React. Without those settings, the form reports that it is not configured instead of showing a false success message.

## Production readiness

This project is intended for local development and demonstrations. Before connecting a public camera or real registration data, evaluate the models on representative footage, tune or fine-tune them, use HTTPS, configure secure production settings and authentication, and restrict access to vehicle records and detection history. Recognition quality depends on lighting, camera placement, plate size, motion blur, and the models' performance on the local plate format. The system compares only visible vehicle type and approximate color; it does not identify an exact physical vehicle or prove plate cloning or tampering. Treat possible mismatches as a prompt for human review.
