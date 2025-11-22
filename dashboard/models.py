from django.db import models
from django.contrib.auth.models import User

class Note(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="notes")
    text = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.text


class Task(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="tasks")
    title = models.CharField(max_length=200)
    completed = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)

    def __str__(self):
        return self.title


class Goal(models.Model):
    GOAL_TYPE_CHOICES = [
        ("static", "Static (Completed or Not)"),
        ("progress", "Progress (Has Target)")
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="goals")
    title = models.CharField(max_length=200)
    goal_type = models.CharField(max_length=10, choices=GOAL_TYPE_CHOICES, default="static")
    
    # Only used if goal_type = "progress"
    target_value = models.PositiveIntegerField(blank=True, null=True)
    current_value = models.PositiveIntegerField(blank=True, null=True)

    completed = models.BooleanField(default=False)

    def progress_percentage(self):
        if self.goal_type == "static":
            return 100 if self.completed else 0
        if self.target_value and self.current_value is not None:
            return min(int((self.current_value / self.target_value) * 100), 100)
        return 0

    def __str__(self):
        return self.title
