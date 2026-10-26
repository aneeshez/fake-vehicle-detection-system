FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    HOME=/home/app \
    YOLO_CONFIG_DIR=/home/app/.config/Ultralytics

RUN apt-get update \
    && apt-get install -y --no-install-recommends libgomp1 libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --system app \
    && useradd --system --gid app --home-dir /home/app --create-home app

WORKDIR /app
COPY requirements.txt ./
RUN python -m pip install --no-cache-dir --upgrade pip \
    && python -m pip install --no-cache-dir -r requirements.txt

COPY . ./
RUN DJANGO_DEBUG=1 DJANGO_SECRET_KEY=build-only FRONTEND_ORIGINS=http://localhost:3000 \
    python manage.py collectstatic --noinput \
    && chown -R app:app /app /home/app

USER app
EXPOSE 8000
CMD ["gunicorn", "config.wsgi:application", "--bind=0.0.0.0:8000", "--workers=1", "--threads=2", "--timeout=600", "--graceful-timeout=30", "--access-logfile=-", "--error-logfile=-"]
