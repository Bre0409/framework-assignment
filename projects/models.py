# projects/models.py
from django.db import models
from django.contrib.auth.models import User

class Project(models.Model):
    STATUS_CHOICES = [
        ("not_started", "Not Started"),
        ("in_progress", "In Progress"),
        ("completed", "Completed"),
        ("blocked", "Blocked"),
    ]

    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name="projects")
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    stakeholders = models.CharField(max_length=300, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="not_started")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class ProjectMessage(models.Model):
    """
    Messages attached to a project. This satisfies:
      - send (create message)
      - receive (view in project detail)
      - archive (hide from main list)
    """
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="messages")
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name="project_messages")

    subject = models.CharField(max_length=255)
    body = models.TextField()

    created_at = models.DateTimeField(auto_now_add=True)
    is_archived = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.subject} ({self.project.name})"
