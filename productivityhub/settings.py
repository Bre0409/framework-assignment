import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = 'your-secret-key-here'  # replace this before deployment
DEBUG = True

ALLOWED_HOSTS = []

# -----------------------------
# INSTALLED APPS
# -----------------------------
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

# -----------------------------
# MIDDLEWARE
# -----------------------------
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# -----------------------------
# URLS + WSGI
# -----------------------------
ROOT_URLCONF = 'productivityhub.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'dashboard' / 'templates'],  # optional override
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

# -----------------------------
# DATABASE
# -----------------------------

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

# -----------------------------
# AUTH + LOGIN
# -----------------------------
LOGIN_REDIRECT_URL = 'home'
LOGOUT_REDIRECT_URL = 'login'
LOGIN_URL = 'login'

# -----------------------------
# STATIC & MEDIA FILES
# -----------------------------
STATIC_URL = '/static/'
STATICFILES_DIRS = [
    BASE_DIR / 'dashboard' / 'static'
]
STATIC_ROOT = BASE_DIR / 'staticfiles'

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# -----------------------------
# LANGUAGE & TIMEZONE
# -----------------------------
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
