from django.shortcuts import render, redirect
from django.contrib import messages
from django.contrib.auth import authenticate, login, logout, update_session_auth_hash
from django.contrib.auth.forms import PasswordChangeForm, UserCreationForm, AuthenticationForm
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from .forms import UserUpdateForm, ProfileUpdateForm

def signup_view(request):
    if request.method == 'POST':
        form = UserCreationForm(request.POST)
        if form.is_valid():
            user = form.save()
            # optionally allow email capture if provided in form data
            email = request.POST.get('email')
            if email:
                user.email = email
                user.save()
            login(request, user)
            messages.success(request, "✅ Account created — welcome!")
            return redirect('home')
        else:
            # show form errors through messages or passed form
            for field, errs in form.errors.items():
                for e in errs:
                    messages.error(request, f"{field}: {e}")
            return redirect('signup')

    form = UserCreationForm()
    return render(request, 'accounts/signup.html', {'form': form})


def login_view(request):
    if request.method == 'POST':
        form = AuthenticationForm(data=request.POST)
        if form.is_valid():
            user = form.get_user()
            login(request, user)
            return redirect('home')
        else:
            messages.error(request, "❌ Invalid username or password.")
            return redirect('login')

    form = AuthenticationForm()
    return render(request, 'accounts/login.html', {'form': form})


def logout_view(request):
    logout(request)
    return redirect('login')


@login_required
def profile_view(request):
    # Ensure profile exists (signals handle creation on user creation, but safe-check here)
    try:
        profile = request.user.profile
    except Exception:
        from .models import Profile
        profile, _ = Profile.objects.get_or_create(user=request.user)

    user_form = UserUpdateForm(instance=request.user)
    profile_form = ProfileUpdateForm(instance=profile)
    password_form = PasswordChangeForm(request.user)

    if request.method == 'POST':
        action = request.POST.get('action')
        if action == 'update_basic':
            user_form = UserUpdateForm(request.POST, instance=request.user)
            profile_form = ProfileUpdateForm(request.POST, request.FILES, instance=profile)
            if user_form.is_valid() and profile_form.is_valid():
                user_form.save()
                profile_form.save()
                messages.success(request, "✅ Profile updated successfully!")
                return redirect('profile')
            else:
                messages.error(request, "Please correct the errors below.")
        elif action == 'change_password':
            form = PasswordChangeForm(request.user, request.POST)
            if form.is_valid():
                user = form.save()
                update_session_auth_hash(request, user)
                messages.success(request, "🔐 Password changed successfully.")
                return redirect('profile')
            else:
                messages.error(request, "❌ Please correct the errors in password form.")
        elif action == 'delete_account':
            confirm = request.POST.get('confirm_delete', '').strip()
            if confirm == 'DELETE':
                user = request.user
                logout(request)
                user.delete()
                messages.success(request, "🗑️ Your account has been deleted.")
                return redirect('signup')
            else:
                messages.error(request, "Type DELETE to confirm account deletion.")

    context = {
        "user_form": user_form,
        "profile_form": profile_form,
        "password_form": password_form,
    }
    return render(request, 'accounts/profile.html', context)


@login_required
def change_password(request):
    # kept for compatibility with older templates if they post to a dedicated URL
    if request.method == "POST":
        form = PasswordChangeForm(request.user, request.POST)
        if form.is_valid():
            user = form.save()
            update_session_auth_hash(request, user)
            messages.success(request, "🔐 Password changed successfully!")
            return redirect("profile")
        else:
            messages.error(request, "❌ Please correct the errors below.")
    return redirect("profile")


@login_required
def delete_account(request):
    if request.method == "POST":
        user = request.user
        logout(request)
        user.delete()
        messages.success(request, "🗑️ Your account has been deleted.")
        return redirect("signup")
    return redirect("profile")
