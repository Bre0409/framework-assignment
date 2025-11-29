from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse, HttpResponseBadRequest
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_POST, require_GET
from django.utils import timezone
from django.db import models
import json

from .models import Task, Goal, Note


# ---------------------------------------------------------
# Default lists (used at first login only – seeding)
# ---------------------------------------------------------

POPULAR_GOALS = [
    {"title": "Drink 8 glasses of water", "goal_type": "progress", "target_value": 8},
    {"title": "Read 20 pages", "goal_type": "progress", "target_value": 20},
    {"title": "Walk 2000 steps", "goal_type": "progress", "target_value": 2000},
    {"title": "Meditate 10 minutes", "goal_type": "static"},
    {"title": "Sleep 8 hours", "goal_type": "static"},
    {"title": "Limit screen time", "goal_type": "static"},
    {"title": "Exercise 20 minutes", "goal_type": "progress", "target_value": 20},
    {"title": "Plan tomorrow in advance", "goal_type": "static"},
    {"title": "Practice gratitude", "goal_type": "static"},
    {"title": "No junk food today", "goal_type": "static"},
    {"title": "Journal for 5 minutes", "goal_type": "static"},
    {"title": "Clean your workspace", "goal_type": "static"},
    {"title": "Reach protein goal", "goal_type": "progress", "target_value": 100},
    {"title": "Take vitamins", "goal_type": "static"},
    {"title": "Learn or study 30 min", "goal_type": "progress", "target_value": 30},
    {"title": "Practice hobby (art/music/etc.)", "goal_type": "static"},
    {"title": "Go outside for fresh air", "goal_type": "static"},
    {"title": "Deep clean 1 small area", "goal_type": "static"},
    {"title": "Message a friend or family member", "goal_type": "static"},
    {"title": "Track spending", "goal_type": "static"},
]

POPULAR_TASKS = [
    "Walk the dog", "Make the bed", "Do the dishes", "Check emails",
    "Go for a run", "Water the plants", "Plan meals", "Clean the kitchen",
    "Read for 20 minutes", "Call a family member", "Meditate",
    "Take vitamins", "Do laundry", "Tidy workspace", "Pay bills",
]


# ---------------------------------------------------------
# Seeding defaults (only on PAGE views)
# ---------------------------------------------------------

def seed_user_defaults(user):
    """
    Creates initial records ONLY if user has none.
    """
    if not user.goals.exists():
        for i, g in enumerate(POPULAR_GOALS):
            Goal.objects.create(
                user=user,
                title=g["title"],
                goal_type=g.get("goal_type", "static"),
                target_value=g.get("target_value"),
                current_value=0,
                order=i,
                selected=False,
            )

    if not user.tasks.exists():
        for i, t in enumerate(POPULAR_TASKS):
            Task.objects.create(
                user=user,
                title=t,
                order=i,
                completed=False,
            )


# ---------------------------------------------------------
# NEW — Sync DB with NEWLY added POPULAR_GOALS
# ---------------------------------------------------------

def sync_popular_goals(user):
    """
    Ensures that if you add new POPULAR_GOALS later,
    they appear in each user's DB.
    """
    existing_titles = set(user.goals.values_list("title", flat=True))
    new_goals = [g for g in POPULAR_GOALS if g["title"] not in existing_titles]

    if new_goals:
        max_order = user.goals.aggregate(models.Max("order"))["order__max"] or 0

        for i, g in enumerate(new_goals, start=max_order + 1):
            Goal.objects.create(
                user=user,
                title=g["title"],
                goal_type=g.get("goal_type", "static"),
                target_value=g.get("target_value"),
                current_value=0,
                order=i,
                selected=False,
            )


# ---------------------------------------------------------
# PAGES
# ---------------------------------------------------------

@login_required
def home(request):
    seed_user_defaults(request.user)

    top_goals_qs = request.user.goals.filter(selected=True).order_by("order")[:5]
    top_goals = [
        {
            "id": g.id,
            "title": g.title,
            "progress": g.progress_percentage() if hasattr(g, "progress_percentage") else 0,
        }
        for g in top_goals_qs
    ]

    top_tasks_qs = request.user.tasks.all().order_by("order")[:5]
    top_tasks = [
        {
            "id": t.id,
            "title": t.title,
            "completed": t.completed,
        }
        for t in top_tasks_qs
    ]

    return render(request, "dashboard/home.html", {
        "top_goals": top_goals,
        "top_tasks": top_tasks,
    })


@login_required
def goals(request):
    seed_user_defaults(request.user)
    sync_popular_goals(request.user)  # <-- FIX: sync new default goals
    return render(request, "dashboard/goals.html")


@login_required
def tasks(request):
    seed_user_defaults(request.user)
    return render(request, "dashboard/tasks.html")


@login_required
def settings_view(request):
    return render(request, "dashboard/settings.html")


# ---------------------------------------------------------
# Helper serializers
# ---------------------------------------------------------

def _goal_to_dict(g: Goal):
    return {
        "id": g.id,
        "title": g.title,
        "goal_type": g.goal_type,
        "progress": g.progress_percentage() if hasattr(g, "progress_percentage") else 0,
        "completed": getattr(g, "completed", False),
        "selected": getattr(g, "selected", False),
        "order": g.order,
    }


def _task_to_dict(t: Task):
    return {
        "id": t.id,
        "title": t.title,
        "completed": t.completed,
        "order": t.order,
    }


def _note_to_dict(n: Note):
    return {
        "id": n.id,
        "text": n.text,
        "completed": getattr(n, "completed", False),
        "created_at": n.created_at.isoformat(),
    }


# ---------------------------------------------------------
# GOALS API
# ---------------------------------------------------------

@login_required
@require_GET
def goals_data(request):
    user = request.user
    user_goals = user.goals.order_by("order", "created_at")

    popular_titles = {g["title"] for g in POPULAR_GOALS}

    popular = []
    custom = []
    saved = []

    for g in user_goals:
        item = {
            "id": g.id,
            "title": g.title,
            "goal_type": g.goal_type,
            "progress": g.progress_percentage(),
            "completed": g.completed,
            "selected": g.selected,
            "order": g.order,
            "target_value": g.target_value,
        }

        if g.selected:
            saved.append(item)

        if g.title in popular_titles:
            popular.append(item)
        else:
            custom.append(item)

    return JsonResponse({
        "popular": popular,
        "custom": custom,
        "saved": saved
    })
@login_required
@require_POST
def goal_toggle_select(request, pk):
    """
    Toggle selected/unselected state for a goal.
    EXACT match to tasks_toggle logic.
    """
    goal = get_object_or_404(Goal, pk=pk, user=request.user)
    goal.selected = not goal.selected
    goal.save()
    return JsonResponse({"ok": True, "selected": goal.selected})


@login_required
@require_POST
def goals_save_selection(request):
    raw_ids = request.POST.getlist("selected_ids[]") or request.POST.getlist("selected_ids")

    try:
        selected_ids = {int(x) for x in raw_ids}
    except (TypeError, ValueError):
        selected_ids = set()

    qs = Goal.objects.filter(user=request.user)

    qs.update(selected=False)
    if selected_ids:
        qs.filter(id__in=selected_ids).update(selected=True)

    return JsonResponse({"ok": True})


@login_required
@require_POST
def goal_update_progress(request, pk):
    goal = get_object_or_404(Goal, pk=pk, user=request.user)

    if goal.goal_type == "progress":
        try:
            progress = int(request.POST.get("progress", 0))
        except (TypeError, ValueError):
            return HttpResponseBadRequest("invalid progress")

        progress = max(0, min(100, progress))

        if goal.target_value:
            goal.current_value = int((progress / 100.0) * goal.target_value)
        else:
            goal.current_value = progress

        goal.completed = progress >= 100
    else:
        completed = request.POST.get("completed")
        if completed is not None:
            goal.completed = completed in ("1", "true", "True", "on")

    goal.save()
    return JsonResponse({
        "ok": True,
        "progress": goal.progress_percentage() if hasattr(goal, "progress_percentage") else 0,
        "completed": goal.completed,
    })


@login_required
@require_POST
def goal_create(request):
    title = request.POST.get("title", "").strip()
    gtype = request.POST.get("goal_type", "static")

    if not title:
        return HttpResponseBadRequest("title required")

    max_order = (
        request.user.goals.aggregate(models.Max("order")).get("order__max") or 0
    )

    goal = Goal.objects.create(
        user=request.user,
        title=title,
        goal_type=gtype,
        order=max_order + 1,
        created_at=timezone.now(),
        selected=False,
    )

    return JsonResponse({"ok": True, "goal": _goal_to_dict(goal)})


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

    if not order_list:
        try:
            payload = json.loads(request.body.decode() or "{}")
            order_list = payload.get("order", [])
        except Exception:
            order_list = []

    for idx, gid in enumerate(order_list):
        try:
            g = Goal.objects.get(pk=int(gid), user=request.user)
            g.order = idx
            g.save()
        except (Goal.DoesNotExist, ValueError, TypeError):
            continue

    return JsonResponse({"ok": True})


# ---------------------------------------------------------
# TASKS API
# ---------------------------------------------------------

@login_required
@require_GET
def tasks_list(request):
    user_tasks_qs = request.user.tasks.all().order_by("order", "created_at")
    tasks_data = [_task_to_dict(t) for t in user_tasks_qs]

    title_to_task = {t.title: t for t in user_tasks_qs}
    popular = []

    for idx, title in enumerate(POPULAR_TASKS):
        existing = title_to_task.get(title)
        popular.append({
            "title": title,
            "selected": bool(existing),
            "id": existing.id if existing else None,
            "order_hint": existing.order if existing else idx,
        })

    popular_titles = set(POPULAR_TASKS)
    custom_tasks = [
        _task_to_dict(t) for t in user_tasks_qs if t.title not in popular_titles
    ]

    return JsonResponse({
        "tasks": tasks_data,
        "popular": popular,
        "custom": custom_tasks,
    })


@login_required
@require_POST
def tasks_save_selection(request):
    titles = request.POST.getlist("titles[]", [])

    cleaned = []
    seen = set()
    for t in titles:
        t = t.strip()
        if not t:
            continue
        if t in seen:
            continue
        seen.add(t)
        cleaned.append(t)

    titles = cleaned

    existing_tasks = list(Task.objects.filter(user=request.user))
    existing_by_title = {t.title: t for t in existing_tasks}
    keep_titles = set(titles)

    for t in existing_tasks:
        if t.title not in keep_titles:
            t.delete()

    for idx, title in enumerate(titles):
        task = existing_by_title.get(title)
        if task:
            task.order = idx
            task.save()
        else:
            Task.objects.create(
                user=request.user,
                title=title,
                order=idx,
            )

    return JsonResponse({"ok": True})


@login_required
@require_POST
def task_toggle(request, pk):
    t = get_object_or_404(Task, pk=pk, user=request.user)
    t.completed = not t.completed
    t.save()
    return JsonResponse({"ok": True, "completed": t.completed})


@login_required
@require_POST
def task_delete(request, pk):
    t = get_object_or_404(Task, pk=pk, user=request.user)
    t.delete()
    return JsonResponse({"ok": True})


# ---------------------------------------------------------
# NOTES
# ---------------------------------------------------------

@login_required
@require_GET
def notes_list(request):
    notes = Note.objects.filter(user=request.user).order_by("-created_at")
    return JsonResponse({
        "notes": [_note_to_dict(n) for n in notes]
    })


@login_required
@require_POST
def note_create(request):
    text = request.POST.get("text", "").trim()
    if not text:
        return HttpResponseBadRequest("text required")

    note = Note.objects.create(
        user=request.user,
        text=text,
        completed=False,
    )

    return JsonResponse({"ok": True, "note": _note_to_dict(note)})


@login_required
@require_POST
def note_toggle(request, pk):
    note = get_object_or_404(Note, pk=pk, user=request.user)
    note.completed = not note.completed
    note.save()
    return JsonResponse({"ok": True, "completed": note.completed})


@login_required
@require_POST
def note_delete(request, pk):
    note = get_object_or_404(Note, pk=pk, user=request.user)
    note.delete()
    return JsonResponse({"ok": True})
