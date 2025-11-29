from django.db import models
from django.contrib.auth.models import User

class Project(models.Model):

    STATUS_CHOICES = [
        ('planned', 'Planned'),
        ('active', 'Active'),
        ('on_hold', 'On Hold'),
        ('completed', 'Completed'),
    ]

    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)

    start_date = models.DateField(blank=True, null=True)
    end_date = models.DateField(blank=True, null=True)

    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name="owned_projects")
    stakeholders = models.ManyToManyField(User, related_name="stakeholder_projects", blank=True)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="planned")

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.name

    @property
    def is_overdue(self):
        from datetime import date
        return self.end_date and self.end_date < date.today() and self.status != "completed"
