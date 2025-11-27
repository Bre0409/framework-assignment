# dashboard/models.py
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Note(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="notes")
    text = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return (self.text[:40] + "...") if len(self.text) > 40 else self.text


class Task(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="tasks")
    title = models.CharField(max_length=200)
    completed = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["order", "-created_at"]

    def __str__(self):
        return self.title

    def to_json(self):
        return {
            "id": self.id,
            "title": self.title,
            "completed": self.completed,
            "order": self.order,
        }


class Goal(models.Model):
    GOAL_TYPE_STATIC = "static"
    GOAL_TYPE_PROGRESS = "progress"
    GOAL_TYPE_CHOICES = [
        (GOAL_TYPE_STATIC, "Static"),
        (GOAL_TYPE_PROGRESS, "Progress"),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="goals")
    title = models.CharField(max_length=200)
    goal_type = models.CharField(
        max_length=16, choices=GOAL_TYPE_CHOICES, default=GOAL_TYPE_STATIC
    )

    # Only used for progress goals
    target_value = models.PositiveIntegerField(blank=True, null=True)
    current_value = models.PositiveIntegerField(blank=True, null=True)

    completed = models.BooleanField(default=False)
    selected = models.BooleanField(default=False)  # shown in "Saved" + Dashboard Top 5
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["order", "-created_at"]

    def progress_percentage(self):
        if self.goal_type == self.GOAL_TYPE_STATIC:
            return 100 if self.completed else 0
        if self.target_value and self.current_value is not None:
            try:
                pct = int((self.current_value / self.target_value) * 100)
            except ZeroDivisionError:
                pct = 0
            return max(0, min(100, pct))
        return 0

    def __str__(self):
        return self.title

    def to_json(self):
        return {
            "id": self.id,
            "title": self.title,
            "goal_type": self.goal_type,
            "target_value": self.target_value,
            "current_value": self.current_value,
            "progress": self.progress_percentage(),
            "completed": self.completed,
            "selected": self.selected,
            "order": self.order,
        }
