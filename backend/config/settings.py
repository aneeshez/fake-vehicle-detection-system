import os
from pathlib import Path
from urllib.parse import unquote, urlparse

from django.core.exceptions import ImproperlyConfigured
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

DEBUG = os.getenv("DJANGO_DEBUG", "0").strip() == "1"
SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "").strip()
if DEBUG and not SECRET_KEY:
    SECRET_KEY = "local-development-only-key-do-not-deploy"
if not SECRET_KEY:
    raise ImproperlyConfigured("Set DJANGO_SECRET_KEY before starting Django.")
if not DEBUG and len(SECRET_KEY) < 50:
    raise ImproperlyConfigured("Use a randomly generated DJANGO_SECRET_KEY of at least 50 characters in production.")

ALLOWED_HOSTS = [host.strip() for host in os.getenv(
    "DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1" if DEBUG else ""
).split(",") if host.strip()]
if not ALLOWED_HOSTS:
    raise ImproperlyConfigured("Set DJANGO_ALLOWED_HOSTS to the production host names.")
if not DEBUG and "*" in ALLOWED_HOSTS:
    raise ImproperlyConfigured("Wildcard hosts are not allowed in production.")

FRONTEND_ORIGINS = [origin.strip().rstrip("/") for origin in os.getenv(
    "FRONTEND_ORIGINS", "http://localhost:3000" if DEBUG else ""
).split(",") if origin.strip()]
if not FRONTEND_ORIGINS:
    raise ImproperlyConfigured("Set FRONTEND_ORIGINS to the trusted frontend origin(s).")
if not DEBUG and any(not origin.startswith("https://") for origin in FRONTEND_ORIGINS):
    raise ImproperlyConfigured("Production frontend origins must use HTTPS.")

DATABASE_URL = os.getenv("DATABASE_URL", "").strip()
if DEBUG and not DATABASE_URL:
    DATABASES = {"default": {"ENGINE": "django.db.backends.sqlite3", "NAME": BASE_DIR / "db.sqlite3"}}
elif DATABASE_URL:
    database_url = urlparse(DATABASE_URL)
    if database_url.scheme not in {"postgres", "postgresql"}:
        raise ImproperlyConfigured("DATABASE_URL must use PostgreSQL in production.")
    DATABASES = {"default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": unquote(database_url.path.lstrip("/")),
        "USER": unquote(database_url.username or ""),
        "PASSWORD": unquote(database_url.password or ""),
        "HOST": database_url.hostname or "",
        "PORT": database_url.port or 5432,
        "CONN_MAX_AGE": 60,
        "OPTIONS": {"sslmode": os.getenv("DATABASE_SSLMODE", "require")},
    }}
else:
    raise ImproperlyConfigured("Set DATABASE_URL to a managed PostgreSQL database in production.")

REDIS_URL = os.getenv("REDIS_URL", "").strip()
if DEBUG and not REDIS_URL:
    CACHES = {"default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache", "LOCATION": "vehicle-detection-local"}}
elif REDIS_URL:
    CACHES = {"default": {
        "BACKEND": "django.core.cache.backends.redis.RedisCache",
        "LOCATION": REDIS_URL,
        "TIMEOUT": 300,
    }}
else:
    raise ImproperlyConfigured("Set REDIS_URL for shared production rate limits.")

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "corsheaders",
    "vehicles",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"
TEMPLATES = [{
    "BACKEND": "django.template.backends.django.DjangoTemplates",
    "DIRS": [],
    "APP_DIRS": True,
    "OPTIONS": {"context_processors": [
        "django.template.context_processors.request",
        "django.contrib.auth.context_processors.auth",
        "django.contrib.messages.context_processors.messages",
    ]},
}]
WSGI_APPLICATION = "config.wsgi.application"

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "en-in"
TIME_ZONE = "Asia/Kolkata"
USE_I18N = True
USE_TZ = True
STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STORAGES = {
    "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    "staticfiles": {"BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage"},
}
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

CORS_ALLOWED_ORIGINS = FRONTEND_ORIGINS
CORS_ALLOW_CREDENTIALS = True
CSRF_TRUSTED_ORIGINS = FRONTEND_ORIGINS
DATA_UPLOAD_MAX_MEMORY_SIZE = 12 * 1024 * 1024
DATA_UPLOAD_MAX_NUMBER_FIELDS = 100
DETECTION_EVENT_RETENTION_DAYS = max(1, int(os.getenv("DETECTION_EVENT_RETENTION_DAYS", "30")))

SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = os.getenv("SESSION_COOKIE_SAMESITE", "Lax")
CSRF_COOKIE_SAMESITE = SESSION_COOKIE_SAMESITE
CSRF_COOKIE_HTTPONLY = False
SESSION_COOKIE_AGE = 8 * 60 * 60
SESSION_EXPIRE_AT_BROWSER_CLOSE = True
SESSION_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SECURE = not DEBUG
SECURE_SSL_REDIRECT = not DEBUG
SECURE_HSTS_SECONDS = 31_536_000 if not DEBUG else 0
SECURE_HSTS_INCLUDE_SUBDOMAINS = not DEBUG
SECURE_HSTS_PRELOAD = False
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = "same-origin"
X_FRAME_OPTIONS = "DENY"
if os.getenv("TRUST_X_FORWARDED_PROTO", "0") == "1":
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
TRUST_PROXY_CLIENT_IP = os.getenv("TRUST_PROXY_CLIENT_IP", "0") == "1"

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {"console": {"class": "logging.StreamHandler"}},
    "loggers": {"vehicles": {"handlers": ["console"], "level": "INFO", "propagate": False}},
}
