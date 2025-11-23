from django.shortcuts import render, get_object_or_404, redirect
from django.http import JsonResponse, HttpResponseBadRequest
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_POST
from django.utils import timezone
from .models import Task, Goal, Note


# ---------------------------------------------------------
# Default lists (used for initial seeding)
# ---------------------------------------------------------

POPULAR_GOALS = [
    {"title": "Drink 8 glasses of water", "goal_type": "progress", "target_value": 8},
    {"title": "Read 20 pages", "goal_type": "progress", "target_value": 20},
    {"title": "Walk 2000 steps", "goal_type": "progress", "target_value": 2000},
    {"title": "Meditate 10 minutes", "goal_type": "static"},
    {"title": "Sleep 8 hours", "goal_type": "static"},
]

POPULAR_TASKS = [
    "Walk the dog", "Make the bed", "Do the dishes", "Check emails",
    "Go for a run", "Water the plants", "Clean the kitchen",
]


# ---------------------------------------------------------
# Function: Seed user defaults (safe to run) 
# ---------------------------------------------------------

def seed_user_defaults(user):
    if not user.goals.exists():
        for i, g in enumerate(POPULAR_GOALS):
            Goal.objects.create(
                user=user,
                title=g["title"],
                goal_type=g.get("goal_type", "static"),
                target_value=g.get("target_value"),
                current_value=0,
                order=i,
            )

    if not user.tasks.exists():
        for i, title in enumerate(POPULAR_TASKS):
            Task.objects.create(
                user=user,
                title=title,
                order=i
            )


# ---------------------------------------------------------
# HOME PAGE (Dashboard)
# ---------------------------------------------------------

@login_required
def home(request):
    seed_user_defaults(request.user)

    top_goals = [
        {"id": g.id, "title": g.title, "progress": g.progress_percentage()}
        for g in request.user.goals.all().order_by("order")[:5]
    ]

    top_tasks = [
        {"id": t.id, "title": t.title, "completed": t.completed}
        for t in request.user.tasks.all().order_by("order")[:5]
    ]

    return render(request, "dashboard/home.html", {
        "top_goals": top_goals,
        "top_tasks": top_tasks,
    })


# ---------------------------------------------------------
# MAIN PAGES
# ---------------------------------------------------------

@login_required
def goals(request):
    seed_user_defaults(request.user)
    return render(request, "dashboard/goals.html")


@login_required
def tasks(request):
    seed_user_defaults(request.user)
    return render(request, "dashboard/tasks.html")


@login_required
def settings_view(request):
    return render(request, "dashboard/settings.html")


# ---------------------------------------------------------
# API: Goals
# ---------------------------------------------------------

@login_required
@require_POST
def goal_toggle_select(request, pk):
    goal = get_object_or_404(Goal, pk=pk, user=request.user)
    goal.selected = not goal.selected
    goal.save()
    return JsonResponse({"ok": True, "selected": goal.selected})


@login_required
@require_POST
def goal_update_progress(request, pk):
    goal = get_object_or_404(Goal, pk=pk, user=request.user)

    if goal.goal_type == "progress":
        progress = int(request.POST.get("progress", 0))
        progress = max(0, min(100, progress))

        if goal.target_value:
            goal.current_value = int((progress / 100) * goal.target_value)

        goal.completed = progress >= 100

    else:
        goal.completed = request.POST.get("completed") in ("1", "true", "on")

    goal.save()
    return JsonResponse({"ok": True, "progress": goal.progress_percentage()})


@login_required
@require_POST
def goal_create(request):
    title = request.POST.get("title", "").strip()
    gtype = request.POST.get("goal_type", "static")

    if not title:
        return HttpResponseBadRequest("title required")

    goal = Goal.objects.create(
        user=request.user,
        title=title,
        goal_type=gtype,
        order=0,
        created_at=timezone.now()
    )

    return JsonResponse({"ok": True, "id": goal.id})


@login_required
@require_POST
def goal_delete(request, pk):
    goal = get_object_or_404(Goal, pk=pk, user=request.user)
    goal.delete()
    return JsonResponse({"ok": True})


@login_required
@require_POST
def goal_reorder(request):
    order_list = request.POST.getlist("order[]")

    for index, gid in enumerate(order_list):
        try:
            g = Goal.objects.get(id=gid, user=request.user)
            g.order = index
            g.save()
        except Goal.DoesNotExist:
            pass

    return JsonResponse({"ok": True})


# ---------------------------------------------------------
# API: Tasks
# ---------------------------------------------------------

@login_required
@require_POST
def task_create(request):
    title = request.POST.get("title", "").strip()
    if not title:
        return HttpResponseBadRequest("title required")

    t = Task.objects.create(user=request.user, title=title)
    return JsonResponse({"ok": True, "id": t.id})


@login_required
@require_POST
def task_toggle(request, pk):
    task = get_object_or_404(Task, id=pk, user=request.user)
    task.completed = not task.completed
    task.save()
    return JsonResponse({"ok": True, "completed": task.completed})


@login_required
@require_POST
def task_delete(request, pk):
    task = get_object_or_404(Task, id=pk, user=request.user)
    task.delete()
    return JsonResponse({"ok": True})


# ---------------------------------------------------------
# API: Notes
# ---------------------------------------------------------

@login_required
@require_POST
def note_create(request):
    text = request.POST.get("text", "").strip()
    if not text:
        return HttpResponseBadRequest("text required")

    note = Note.objects.create(user=request.user, text=text)
    return JsonResponse({"ok": True, "id": note.id})


@login_required
@require_POST
def note_delete(request, pk):
    note = get_object_or_404(Note, id=pk, user=request.user)
    note.delete()
    return JsonResponse({"ok": True})
