import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
application = get_wsgi_application()

# In the single-worker production container, initialize the computer-vision
# models once at startup so the first camera request does not trigger downloads.
if os.getenv("PRELOAD_MODELS") == "1":
    from vehicles.vision import _get_models

    _get_models()
