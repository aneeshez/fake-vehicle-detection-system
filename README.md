# Fake Vehicle Detection

Fake Vehicle Detection is a web application that checks whether a vehicle seen by a camera is consistent with the vehicle registered to its number plate. It reads a plate, searches the registered vehicle database, then compares the detected vehicle type and approximate color with the saved record.

Treat a mismatch as an alert for a person to review. A visual type or color comparison cannot prove that a vehicle is fraudulent, cloned, or carrying a tampered plate. Recognition quality depends on camera placement, lighting, motion blur, plate size, and model performance on local plates.

## How it works

1. An authenticated operator captures a camera frame or selects a JPEG, PNG, or WebP image.
2. FastALPR detects and reads a number plate. YOLO26n detects a vehicle class, and OpenCV estimates its broad color.
3. Django normalizes the recognized plate and looks it up in the vehicle register.
4. A registered record is compared against the visible vehicle type and approximate color. The result is a match, possible mismatch, no record, unreadable plate, or a request for human review.
5. Django records recognized results and suppresses repeated identical status events for the same plate for 30 seconds. Old events can be purged with a management command.

The application does not retain uploaded image files. Captured evidence is returned to the browser for display. Detection history contains plate text, result, detected type/color, message, and timestamp.

## Features and technology

- React 19, Vite, React Router, Axios, and React Webcam frontend
- Django 5.2 API, session authentication, CSRF protection, rate limits, and Django Admin
- FastALPR plate detection/OCR, YOLO26n vehicle detection, OpenCV color estimates
- SQLite for local development; PostgreSQL and Redis for the supplied production Compose stack
- Docker Compose deployment files for Django/Gunicorn, Nginx, PostgreSQL, and Redis

The previous Flask API and Supabase integration are not part of the current app. Do not use the old `frontend/build/` output; Vite builds the current frontend into `frontend/dist/`.

## Local development on Windows

Requirements: Python 3.10 or newer, Node.js 22.22 or newer, npm, and a camera or test image. The first vision-model startup may download model files and take several minutes. Internet access is required for that first model download.

### Start Django

In PowerShell:

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

Django runs at `http://localhost:8000`. Visit `http://localhost:8000/admin/` and sign in with the superuser you created. Add vehicle records there. A record needs a unique plate, a vehicle type (`car`, `motorcycle`, `bus`, or `truck`), and a color. Make/model and owner are optional. Color matching is approximate; use simple color names such as `white`, `black`, `gray`, `red`, `blue`, `green`, `yellow`, or `orange`.

### Start React

In another PowerShell terminal:

```powershell
cd frontend
npm ci
Copy-Item .env.example .env.local
npm start
```

Open `http://localhost:3000`. Select **Detect**, sign in with the Django account, then allow camera access or choose an image. To connect to a Django API on a different address, set `VITE_API_BASE_URL` in `frontend/.env.local`, for example `http://localhost:8000/api`, and restart Vite. The default local value is already in `.env.example`.

The contact form sends email only when the optional `VITE_EMAILJS_*` settings and a matching EmailJS template are configured. `VITE_CONTACT_EMAIL` supplies its recipient address.

## API routes

- `GET /api/health/` — basic API and model loading status; public and does not expose internal errors
- `GET /api/auth/csrf/`, `GET /api/auth/session/`, `POST /api/auth/login/`, `POST /api/auth/logout/` — session authentication
- `POST /api/detect/` — authenticated image analysis; JSON body has an `image` data URL
- `GET /api/vehicles/`, `GET /api/events/` — authenticated vehicle register and recent detection history
- `/admin/` — manage vehicle records and Django accounts

Create operator accounts through Django Admin or `python manage.py createsuperuser`. There is no public account-registration flow. Give operators only the access needed for their role; Django Admin permissions control who can manage the register.

## Production deployment with Docker Compose

The Compose stack is a starting deployment for a single host. It runs the app behind an external TLS reverse proxy. The web container is bound to `127.0.0.1:8080` by default; configure the host proxy to terminate HTTPS and forward requests to that address while preserving the original `Host`, `X-Forwarded-Proto: https`, and the real client IP in `X-Forwarded-For`. The edge proxy must overwrite incoming forwarded headers rather than trusting values supplied by internet clients. Do not expose the app over public plain HTTP. Set the public hostname and origin to the same HTTPS site.

1. Install Docker Engine and the Docker Compose plugin on the deployment host.
2. Copy `.env.production.example` to `.env`. Set a unique `DJANGO_SECRET_KEY` with at least 50 random characters, a real hostname in `DJANGO_ALLOWED_HOSTS`, and its HTTPS origin in `FRONTEND_ORIGINS`. Use long random hexadecimal values for the PostgreSQL and Redis passwords (hex avoids URL-escaping problems in the Compose connection strings). Keep `.env` private and out of version control.
3. Build and start the services:

   ```sh
   docker compose up --build -d
   ```

4. Apply database migrations and create the first operator account:

   ```sh
   docker compose exec backend python manage.py migrate
   docker compose exec backend python manage.py createsuperuser
   ```

5. Configure the host TLS proxy, then open the HTTPS site and sign in. Monitor startup with `docker compose logs -f backend web` while the vision models initialize for the first time.

The Compose example persists PostgreSQL data, Redis data, and model caches in named volumes. Arrange encrypted off-host database backups and periodically test a restore. Run event cleanup on a schedule, for example daily:

```sh
docker compose exec -T backend python manage.py purge_detection_events
```

Change `DETECTION_EVENT_RETENTION_DAYS` in `.env` to adjust the default 30-day event retention. Set a value that matches the organization’s privacy and retention requirements.

## Model configuration and limits

The default plate detector/OCR and YOLO26n models are loaded on startup in the Compose deployment and lazily on the first local scan. The initial startup downloads model files; subsequent starts use the persisted model cache. Override `ALPR_DETECTOR_MODEL`, `ALPR_OCR_MODEL`, or `VEHICLE_MODEL` in the backend environment only with models compatible with the installed libraries.

The system selects a plate and vehicle based on detections in one frame. It can select the wrong vehicle when multiple vehicles overlap, and broad color estimates are affected by shadows, reflections, paint, and lighting. It does not validate the plate against an official registration authority, establish ownership, compare VIN/chassis identifiers, track a vehicle across frames, or prove fraud. Keep a human in the decision loop.

## Checks

From `backend/`:

```sh
python manage.py check
python manage.py test vehicles
```

From `frontend/`:

```sh
npm ci
npm test
npm run build
npm audit
```

For a real production environment, also run Django's deployment checks with its actual environment settings and validate the TLS proxy, database backups, monitoring, and model behavior on representative footage. `runserver` is for development only.

## Production readiness status

The code now has production-oriented defaults, authenticated private APIs, secure session/CSRF handling, request validation, PostgreSQL/Redis configuration, static-file serving, Docker deployment files, and event-retention tooling. This repository alone cannot establish that a deployment is ready for live traffic: the Compose image build and TLS configuration must be verified on the target host, representative camera footage must be evaluated for false matches and missed detections, and operational controls (backups/restore, monitoring, account management, and privacy/legal review) must be set up for the actual deployment. Do not use a mismatch result as an automated enforcement decision.
