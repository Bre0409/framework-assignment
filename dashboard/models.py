# dashboard/models.py

from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


# ============================================================
# TASKS
# ============================================================
class Task(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="tasks")
    title = models.CharField(max_length=255)
    completed = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["order", "created_at"]

    def __str__(self):
        return self.title


# ============================================================
# GOALS
# ============================================================
class Goal(models.Model):
    GOAL_TYPE_STATIC = "static"       # checkbox goal
    GOAL_TYPE_PROGRESS = "progress"   # numeric % based

    GOAL_TYPES = [
        (GOAL_TYPE_STATIC, "Static (checkbox)"),
        (GOAL_TYPE_PROGRESS, "Progress (numeric)"),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="goals")
    title = models.CharField(max_length=255)
    goal_type = models.CharField(
        max_length=20,
        choices=GOAL_TYPES,
        default=GOAL_TYPE_STATIC,
    )

    # For progress-type goals
    target_value = models.IntegerField(null=True, blank=True)
    current_value = models.IntegerField(default=0)

    # General flags
    completed = models.BooleanField(default=False)
    selected = models.BooleanField(default=False)

    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["order", "created_at"]

    def progress_percentage(self):
        """Return 0–100% progress for progress goals, or 100 if static + completed."""
        if self.goal_type == self.GOAL_TYPE_STATIC:
            return 100 if self.completed else 0

        if self.goal_type == self.GOAL_TYPE_PROGRESS:
            if self.target_value and self.target_value > 0:
                return int((self.current_value / self.target_value) * 100)
            return 0

        return 0

    def __str__(self):
        return self.title


# ============================================================
# NOTES  (NEW, with checkbox support + DB persistence)
# ============================================================
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class Note(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="notes")
    text = models.CharField(max_length=255)
    completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.text[:30]}..."
