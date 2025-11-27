# dashboard/views.py

from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse, HttpResponseBadRequest
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_POST, require_GET
from django.utils import timezone
from django.db import models

from .models import Task, Goal, Note


# ---------------------------------------------------------
# Default lists (seed data)
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
# Seeding defaults (ONLY tasks; goals use POPULAR_GOALS list)
# ---------------------------------------------------------

def seed_user_defaults(user):
    """
    Called from page views (home/tasks) to ensure the user has some data.
    We ONLY seed tasks here; goals are built from POPULAR_GOALS dynamically.
    """
    if not user.tasks.exists():
        for i, t in enumerate(POPULAR_TASKS):
            Task.objects.create(
                user=user,
                title=t,
                order=i,
                completed=False,
            )


# ---------------------------------------------------------
# PAGES
# ---------------------------------------------------------

@login_required
def home(request):
    """
    Dashboard: show top 5 saved goals and top 5 tasks.
    """
    seed_user_defaults(request.user)

    top_goals_qs = request.user.goals.filter(selected=True).order_by("order")[:5]
    top_goals = [
        {
            "id": g.id,
            "title": g.title,
            "progress": g.progress_percentage(),
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
    """
    Goals selection / management page.
    No seeding here — the page uses POPULAR_GOALS + DB-backed goals.
    """
    return render(request, "dashboard/goals.html")


@login_required
def tasks(request):
    """
    Tasks selection / management page.
    """
    seed_user_defaults(request.user)
    return render(request, "dashboard/tasks.html")


@login_required
def settings_view(request):
    return render(request, "dashboard/settings.html")


# ---------------------------------------------------------
# Helpers
# ---------------------------------------------------------

def _goal_to_dict(g: Goal):
    return {
        "id": g.id,
        "title": g.title,
        "goal_type": g.goal_type,
        "progress": g.progress_percentage(),
        "completed": g.completed,
        "selected": g.selected,
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
        "created_at": n.created_at.isoformat(),
    }


# ---------------------------------------------------------
# GOALS API  (staged selection + save button)
# ---------------------------------------------------------

@login_required
@require_GET
def goals_data(request):
    """
    Returns:
      - popular: always 20 POPULAR_GOALS, with id/selected if DB goal exists
      - custom: all user-created goals whose titles are not in POPULAR_GOALS
      - saved: ALL goals where selected=True

    This is used by goals.js to build:
      - Popular Goals
      - Your Custom Goals
      - Saved Goals
    """
    user_goals = list(request.user.goals.all().order_by("order", "created_at"))
    by_title = {g.title: g for g in user_goals}
    popular_titles = {g["title"] for g in POPULAR_GOALS}

    # Build popular goals list from static list + DB matches
    popular = []
    for seed in POPULAR_GOALS:
        title = seed["title"]
        existing = by_title.get(title)
        if existing:
            popular.append(_goal_to_dict(existing))
        else:
            # synthetic item (not yet in DB)
            popular.append({
                "id": None,
                "title": title,
                "goal_type": seed.get("goal_type", "static"),
                "progress": 0,
                "completed": False,
                "selected": False,
                "order": None,
            })

    # Custom goals: anything in DB not in POPULAR list
    custom = [
        _goal_to_dict(g)
        for g in user_goals
        if g.title not in popular_titles
    ]

    # Saved goals = selected=True
    saved = [
        _goal_to_dict(g)
        for g in user_goals
        if g.selected
    ]

    return JsonResponse({
        "popular": popular,
        "custom": custom,
        "saved": saved,
    })


@login_required
@require_POST
def goals_save_selection(request):
    """
    Called when user clicks 'Save Goals' on the goals page.

    Expects:
      - goal_ids[]      => existing Goal IDs to mark selected
      - custom_titles[] => new custom goals to create + select

    Behavior:
      - Clears 'selected' on all user's goals
      - Marks given IDs as selected=True
      - Creates new custom Goal rows for each title in custom_titles[]
      - New goals are marked selected=True and appended at the end of ordering
    """
    # IDs of existing goals the user selected
    raw_ids = request.POST.getlist("goal_ids[]", [])
    goal_ids = []
    for v in raw_ids:
        try:
            goal_ids.append(int(v))
        except (TypeError, ValueError):
            continue

    # Titles of new custom goals
    custom_titles = [
        t.strip() for t in request.POST.getlist("custom_titles[]", []) if t.strip()
    ]

    # Reset all goals to unselected
    request.user.goals.update(selected=False)

    # Mark existing IDs
    for pk in goal_ids:
        try:
            g = Goal.objects.get(pk=pk, user=request.user)
            g.selected = True
            g.save()
        except Goal.DoesNotExist:
            continue

    # Create new custom goals and mark selected=True
    if custom_titles:
        max_order = (
            request.user.goals.aggregate(models.Max("order")).get("order__max") or 0
        )
        for title in custom_titles:
            max_order += 1
            Goal.objects.create(
                user=request.user,
                title=title,
                goal_type=Goal.GOAL_TYPE_STATIC,  # default; could be extended to pass type
                selected=True,
                order=max_order,
                created_at=timezone.now(),
            )

    return JsonResponse({"ok": True})


@login_required
@require_POST
def goal_update_progress(request, pk):
    """
    Update progress or completed state for a progress-type goal.
    Called when user changes progress dropdown (0/25/50/75/100).
    """
    goal = get_object_or_404(Goal, pk=pk, user=request.user)

    if goal.goal_type != Goal.GOAL_TYPE_PROGRESS:
        return HttpResponseBadRequest("Not a progress goal")

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
    goal.save()

    return JsonResponse({
        "ok": True,
        "progress": goal.progress_percentage(),
        "completed": goal.completed,
    })


@login_required
@require_POST
def goal_toggle(request, pk):
    """
    Toggle 'completed' for a static goal (checkbox) in the Saved tab.
    'selected' (saved membership) is controlled by goals_save_selection.
    """
    goal = get_object_or_404(Goal, pk=pk, user=request.user)
    goal.completed = not goal.completed
    goal.save()
    return JsonResponse({"ok": True, "completed": goal.completed})


@login_required
@require_POST
def goal_delete(request, pk):
    goal = get_object_or_404(Goal, pk=pk, user=request.user)
    goal.delete()
    return JsonResponse({"ok": True})


@login_required
@require_POST
def goal_reorder(request):
    """
    Reorder saved goals based on list of IDs.
    Expects POST['order[]'] = [id1, id2, ...]
    """
    order_list = request.POST.getlist("order[]")

    if not order_list:
        import json
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
        except Exception:
            continue

    return JsonResponse({"ok": True})


# ---------------------------------------------------------
# TASKS API  (Save Tasks behaviour)
# ---------------------------------------------------------

@login_required
@require_GET
def tasks_list(request):
    """
    Returns:
      - tasks: all currently saved tasks (DB)
      - popular: metadata for popular tasks

    Used by tasks.js to populate:
      - Popular Tasks
      - Custom Tasks
      - Saved Tasks
    """
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

    return JsonResponse({
        "tasks": tasks_data,
        "popular": popular,
    })


@login_required
@require_POST
def tasks_save_selection(request):
    """
    Called when user presses 'Save Tasks'.

    Expects titles[] containing *all* tasks the user wants saved
    (popular + custom). Then:
      - delete tasks whose titles are not in that list
      - ensure each title in the list has a Task row
      - update 'order' to match the incoming order
    """
    titles = request.POST.getlist("titles[]", [])

    # Normalize + dedupe while preserving order
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

    # Current tasks
    existing_tasks = list(Task.objects.filter(user=request.user))
    existing_by_title = {t.title: t for t in existing_tasks}
    keep_titles = set(titles)

    # Delete those no longer selected
    for t in existing_tasks:
        if t.title not in keep_titles:
            t.delete()

    # Ensure each selected title exists, and set order
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
    """
    Toggle completion for a saved task.
    Used in Saved tab + dashboard.
    """
    t = get_object_or_404(Task, pk=pk, user=request.user)
    t.completed = not t.completed
    t.save()
    return JsonResponse({"ok": True, "completed": t.completed})


@login_required
@require_POST
def task_delete(request, pk):
    """
    Delete a single task from Saved tab.
    """
    t = get_object_or_404(Task, pk=pk, user=request.user)
    t.delete()
    return JsonResponse({"ok": True})


# ---------------------------------------------------------
# NOTES
# ---------------------------------------------------------

@login_required
@require_POST
def note_create(request):
    text = request.POST.get("text", "").strip()
    if not text:
        return HttpResponseBadRequest("text required")

    note = Note.objects.create(user=request.user, text=text)
    return JsonResponse({"ok": True, "note": _note_to_dict(note)})


@login_required
@require_POST
def note_delete(request, pk):
    note = get_object_or_404(Note, pk=pk, user=request.user)
    note.delete()
    return JsonResponse({"ok": True})
