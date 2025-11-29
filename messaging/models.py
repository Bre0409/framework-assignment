# messaging/models.py
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


class Message(models.Model):
    sender = models.ForeignKey(
        User, related_name="sent_messages", on_delete=models.CASCADE
    )
    recipient = models.ForeignKey(
        User, related_name="received_messages", on_delete=models.CASCADE
    )

    subject = models.CharField(max_length=255)
    body = models.TextField()

    # Attachments: PDF, images, etc.
    attachment = models.FileField(
        upload_to="attachments/%Y/%m/%d/",
        null=True,
        blank=True
    )

    created_at = models.DateTimeField(default=timezone.now)

    # Status flags
    is_read = models.BooleanField(default=False)
    archived = models.BooleanField(default=False)

    # Soft delete (trash)
    deleted_by_sender = models.BooleanField(default=False)
    deleted_by_recipient = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.subject} ({self.sender} → {self.recipient})"

    def is_deleted_for(self, user):
        if user == self.sender:
            return self.deleted_by_sender
        if user == self.recipient:
            return self.deleted_by_recipient
        return True
