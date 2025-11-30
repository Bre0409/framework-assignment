import os
from pathlib import Path
import dj_database_url

# =========================================
# BASE DIRECTORY
# =========================================

BASE_DIR = Path(__file__).resolve().parent.parent

# =========================================
# SECRET KEY
# =========================================

SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", "dev-secret-key")

# =========================================
# PRODUCTION CHECK (Render)
# =========================================

PRODUCTION = os.environ.get("RENDER") is not None

# =========================================
# DEBUG & HOSTS
# =========================================

DEBUG = not PRODUCTION

if PRODUCTION:
    ALLOWED_HOSTS = [
        ".onrender.com",
        "productivityhub.onrender.com",
        "localhost",
        "127.0.0.1",
    ]
else:
    ALLOWED_HOSTS = ["*"]

# =========================================
# INSTALLED APPS
# =========================================

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Local apps
    'dashboard',
    'accounts.apps.AccountsConfig',
    'projects',
    'messaging',
]

# =========================================
# MIDDLEWARE
# =========================================

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',

    # Serve static files in production
    'whitenoise.middleware.WhiteNoiseMiddleware',

    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# =========================================
# URLS & WSGI
# =========================================

ROOT_URLCONF = 'productivityhub.urls'
WSGI_APPLICATION = 'productivityhub.wsgi.application'

# =========================================
# TEMPLATES
# =========================================

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        
        'DIRS': [
            BASE_DIR / 'dashboard' / 'templates',
            BASE_DIR / 'accounts' / 'templates',
        ],

        'APP_DIRS': True,

        'OPTIONS': {
            'context_processors': [
                'messaging.context_processors.messaging_unread_counts',
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

# =========================================
# DATABASES
# =========================================

# Default local database (ignored in production)
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'productivity_db',
        'USER': 'productivity_user',
        'PASSWORD': 'mypassword123',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}

# Render PostgreSQL
if PRODUCTION and os.environ.get("DATABASE_URL"):
    DATABASES["default"] = dj_database_url.parse(
        os.environ["DATABASE_URL"],
        conn_max_age=600,
        ssl_require=True
    )

# =========================================
# LOGIN SETTINGS
# =========================================

LOGIN_REDIRECT_URL = 'home'
LOGOUT_REDIRECT_URL = 'login'
LOGIN_URL = 'login'

# =========================================
# PROXY / SSL / CSRF — REQUIRED FOR RENDER
# =========================================

if PRODUCTION:

    # Honor HTTPS from Render proxy
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

    # Required or login POST will fail!
    CSRF_TRUSTED_ORIGINS = [
        "https://*.onrender.com",
        "https://productivityhub.onrender.com",
    ]

    USE_X_FORWARDED_HOST = True

    # Render free-tier does not support end-to-end HTTPS
    SECURE_SSL_REDIRECT = False
    SESSION_COOKIE_SECURE = False
    CSRF_COOKIE_SECURE = False

    SECURE_HSTS_SECONDS = 0

else:
    SECURE_SSL_REDIRECT = False
    SESSION_COOKIE_SECURE = False
    CSRF_COOKIE_SECURE = False

# =========================================
# STATIC FILES (Whitenoise)
# =========================================

STATIC_URL = '/static/'

STATICFILES_DIRS = [
    BASE_DIR / 'dashboard' / 'static',
]

STATIC_ROOT = BASE_DIR / "staticfiles"

STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

# =========================================
# MEDIA FILES
# =========================================

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# =========================================
# LOCALIZATION
# =========================================

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# =========================================
# DEFAULT PK
# =========================================

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
