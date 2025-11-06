from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from django.contrib import messages
from django.contrib.auth.decorators import login_required


def home(request):
    return render(request, 'dashboard/home.html')

def goals(request):
    return render(request, 'dashboard/goals.html')

# @login_required
def tasks(request):
    return render(request, 'dashboard/tasks.html')

def profile(request):
    return render(request, 'dashboard/profile.html')

def settings_view(request):
    return render(request, 'dashboard/settings.html')

def signup_view(request):
    if request.method == 'POST':
        form = UserCreationForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            return redirect('home')
    else:
        form = UserCreationForm()
    return render(request, 'dashboard/signup.html', {'form': form})

def login_view(request):
    if request.method == 'POST':
        form = AuthenticationForm(data=request.POST)
        if form.is_valid():
            user = form.get_user()
            login(request, user)
            return redirect('home')
        else:
            messages.error(request, "Invalid credentials")
    else:
        form = AuthenticationForm()
    return render(request, 'dashboard/login.html', {'form': form})

def logout_view(request):
    logout(request)
    return redirect('login')



# @login_required(login_url='login')
def home(request):
    return render(request, 'dashboard/home.html')

# fake dEtails for tasks and goals
def home(request):
    top_goals = [
        {"title": "Run 5km three times a week", "progress": 80},
        {"title": "Read 20 pages daily", "progress": 70},
        {"title": "Meditate 10 min/day", "progress": 60},
        {"title": "Drink more water", "progress": 90},
        {"title": "Sleep 8 hours", "progress": 75},
    ]

    top_tasks = [
        {"title": "Walk the dog", "completed": True},
        {"title": "Buy groceries", "completed": False},
        {"title": "Clean the desk", "completed": True},
        {"title": "Do laundry", "completed": False},
        {"title": "Call mom", "completed": False},
    ]

    return render(request, "dashboard/home.html", {
        "top_goals": top_goals,
        "top_tasks": top_tasks,
    })
