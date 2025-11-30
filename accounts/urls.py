from django.urls import path
from django.contrib.auth import views as auth_views
from . import views

urlpatterns = [
    # ------------------------
    # Registration + Activation
    # ------------------------
    path("signup/", views.signup_view, name="signup"),
    path("activate/<uidb64>/<token>/", views.activate_account, name="activate"),

    # ------------------------
    # Login / Logout
    # ------------------------
    path(
        "login/",
        auth_views.LoginView.as_view(
            template_name="accounts/login.html",
            redirect_authenticated_user=True,
        ),
        name="login",
    ),

    # FIXED LOGOUT
    path(
        "logout/",
        auth_views.LogoutView.as_view(next_page="login"),
        name="logout",
    ),

    # ------------------------
    # Password Reset Workflow
    # ------------------------
    path(
        "password-reset/",
        auth_views.PasswordResetView.as_view(
            template_name="accounts/password_reset.html",
            email_template_name="accounts/password_reset_email.html",
            subject_template_name="accounts/password_reset_subject.txt",
        ),
        name="password_reset",
    ),

    path(
        "password-reset/done/",
        auth_views.PasswordResetDoneView.as_view(
            template_name="accounts/password_reset_done.html"
        ),
        name="password_reset_done",
    ),

    path(
        "password-reset-confirm/<uidb64>/<token>/",
        auth_views.PasswordResetConfirmView.as_view(
            template_name="accounts/password_reset_confirm.html"
        ),
        name="password_reset_confirm",
    ),

    path(
        "password-reset-complete/",
        auth_views.PasswordResetCompleteView.as_view(
            template_name="accounts/password_reset_complete.html"
        ),
        name="password_reset_complete",
    ),

    # ------------------------
    # Profile
    # ------------------------
    path("profile/", views.profile_view, name="profile"),
]
