import os
from pathlib import Path
import dj_database_url

# =========================================================
# BASE DIRECTORY
# =========================================================

BASE_DIR = Path(__file__).resolve().parent.parent


# =========================================================
# SECRET KEY
# =========================================================

SECRET_KEY = os.environ.get(
    "DJANGO_SECRET_KEY",
    "replace-this-before-production"
)


# =========================================================
# PRODUCTION DETECTION (Render)
# =========================================================

PRODUCTION = os.environ.get("RENDER") is not None


# =========================================================
# DEBUG & HOSTS
# =========================================================

if PRODUCTION:
    DEBUG = False
    ALLOWED_HOSTS = [
        ".onrender.com",
        "localhost",
        "127.0.0.1",
    ]
else:
    DEBUG = True
    ALLOWED_HOSTS = ["*"]


# =========================================================
# INSTALLED APPS
# =========================================================

INSTALLED_APPS = [
    # Django core apps
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


# =========================================================
# MIDDLEWARE
# =========================================================

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]


# =========================================================
# URL + WSGI
# =========================================================

ROOT_URLCONF = 'productivityhub.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',

        # Custom template directory
        'DIRS': [
            BASE_DIR / 'dashboard' / 'templates',
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

WSGI_APPLICATION = 'productivityhub.wsgi.application'


# =========================================================
# DATABASE CONFIGURATION
# =========================================================

# Local PostgreSQL
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

# Render PostgreSQL override
if PRODUCTION and os.environ.get("DATABASE_URL"):
    DATABASES["default"] = dj_database_url.parse(
        os.environ["DATABASE_URL"],
        conn_max_age=600,
        ssl_require=True
    )


# =========================================================
# AUTH / LOGIN SETTINGS
# =========================================================

LOGIN_REDIRECT_URL = 'home'
LOGOUT_REDIRECT_URL = 'login'
LOGIN_URL = 'login'


# =========================================================
# SECURITY (PRODUCTION ONLY)
# =========================================================

if PRODUCTION:
    # HTTPS Enforcement
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True

    # HSTS
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True

    # Security headers
    SECURE_CONTENT_TYPE_NOSNIFF = True
    SECURE_BROWSER_XSS_FILTER = True
    X_FRAME_OPTIONS = "DENY"

else:
    # Local development (avoid forcing HTTPS)
    SECURE_SSL_REDIRECT = False
    SESSION_COOKIE_SECURE = False
    CSRF_COOKIE_SECURE = False


# =========================================================
# STATIC FILES
# =========================================================

STATIC_URL = '/static/'

# Your dashboard static directory
STATICFILES_DIRS = [
    BASE_DIR / 'dashboard' / 'static'
]

# Where Render collects static files
STATIC_ROOT = BASE_DIR / 'staticfiles'


# =========================================================
# MEDIA FILES
# =========================================================

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'


# =========================================================
# LOCALIZATION
# =========================================================

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True


# =========================================================
# DEFAULT PK TYPE
# =========================================================

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
