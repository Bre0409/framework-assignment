# messaging/views.py
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.http import HttpResponseForbidden
from django.db import models  # needed for models.Q
from .models import Message
from .forms import MessageForm


# -------------------------
# Helper: ensure user can view message
# -------------------------
def user_can_access(msg, user):
    """
    Superusers can access all messages.
    Normal users can access messages they sent or received.
    """
    if user.is_superuser:
        return True
    return msg.sender == user or msg.recipient == user


# -------------------------
# Inbox
# -------------------------
@login_required
def inbox(request):
    """
    Superusers: all non-archived, non-deleted messages (as recipient).
    Normal users: messages where they are the recipient.
    """
    if request.user.is_superuser:
        qs = Message.objects.filter(
            archived=False,
            deleted_by_recipient=False,
        )
    else:
        qs = Message.objects.filter(
            recipient=request.user,
            archived=False,
            deleted_by_recipient=False,
        )

    messages_qs = qs.order_by("-created_at")

    return render(
        request,
        "messaging/inbox.html",
        {"messages": messages_qs, "folder": "inbox"},
    )


# -------------------------
# Sent
# -------------------------
@login_required
def sent(request):
    """
    Superusers: all messages not deleted_by_sender.
    Normal users: messages they sent.
    """
    if request.user.is_superuser:
        qs = Message.objects.filter(deleted_by_sender=False)
    else:
        qs = Message.objects.filter(
            sender=request.user, deleted_by_sender=False
        )

    messages_qs = qs.order_by("-created_at")

    return render(
        request,
        "messaging/sent.html",
        {"messages": messages_qs, "folder": "sent"},
    )


# -------------------------
# Archived
# -------------------------
@login_required
def archived(request):
    """
    Superusers: all archived messages.
    Normal users: archived messages they received.
    """
    if request.user.is_superuser:
        qs = Message.objects.filter(
            archived=True,
            deleted_by_recipient=False,
        )
    else:
        qs = Message.objects.filter(
            recipient=request.user,
            archived=True,
            deleted_by_recipient=False,
        )

    messages_qs = qs.order_by("-created_at")

    return render(
        request,
        "messaging/archived.html",
        {"messages": messages_qs, "folder": "archive"},
    )


# -------------------------
# Trash
# -------------------------
@login_required
def trash(request):
    """
    Superusers: all messages that are flagged deleted by someone.
    Normal users: messages they sent/received that they deleted.
    """
    if request.user.is_superuser:
        qs = Message.objects.filter(
            models.Q(deleted_by_sender=True) | models.Q(deleted_by_recipient=True)
        )
    else:
        qs = Message.objects.filter(
            models.Q(sender=request.user, deleted_by_sender=True)
            | models.Q(recipient=request.user, deleted_by_recipient=True)
        )

    messages_qs = qs.order_by("-created_at")

    return render(
        request,
        "messaging/trash.html",
        {"messages": messages_qs, "folder": "trash"},
    )


# -------------------------
# Compose
# -------------------------
@login_required
def compose(request):
    """
    Any authenticated user can compose a message.
    """
    if request.method == "POST":
        form = MessageForm(request.POST, request.FILES)
        if form.is_valid():
            msg = form.save(commit=False)
            msg.sender = request.user
            msg.save()
            return redirect("sent")
    else:
        form = MessageForm()

    # Don't allow sending to yourself
    form.fields["recipient"].queryset = User.objects.exclude(id=request.user.id)

    return render(request, "messaging/compose.html", {"form": form})


# -------------------------
# Message Detail
# -------------------------
@login_required
def message_detail(request, pk):
    msg = get_object_or_404(Message, pk=pk)

    if not user_can_access(msg, request.user):
        return HttpResponseForbidden("Not allowed")

    # Mark as read only if recipient (or superuser acting as recipient)
    if msg.recipient == request.user and not msg.is_read:
        msg.is_read = True
        msg.save()

    return render(request, "messaging/message_detail.html", {"message": msg})


# -------------------------
# Archive / Unarchive
# -------------------------
@login_required
def toggle_archive(request, pk):
    msg = get_object_or_404(Message, pk=pk)

    # Recipient or superuser
    if not (request.user.is_superuser or msg.recipient == request.user):
        return HttpResponseForbidden("Not allowed")

    msg.archived = not msg.archived
    msg.save()
    return redirect("inbox")


# -------------------------
# Soft Delete
# -------------------------
@login_required
def delete_message(request, pk):
    msg = get_object_or_404(Message, pk=pk)

    # Sender side delete
    if msg.sender == request.user or request.user.is_superuser:
        msg.deleted_by_sender = True

    # Recipient side delete
    if msg.recipient == request.user or request.user.is_superuser:
        msg.deleted_by_recipient = True

    msg.save()
    return redirect(request.GET.get("next", "inbox"))


# -------------------------
# Restore from trash
# -------------------------
@login_required
def restore_message(request, pk):
    msg = get_object_or_404(Message, pk=pk)

    if not user_can_access(msg, request.user):
        return HttpResponseForbidden("Not allowed")

    if msg.sender == request.user or request.user.is_superuser:
        msg.deleted_by_sender = False
    if msg.recipient == request.user or request.user.is_superuser:
        msg.deleted_by_recipient = False

    msg.save()
    return redirect("trash")


# -------------------------
# Permanent Delete
# -------------------------
@login_required
def permanent_delete(request, pk):
    msg = get_object_or_404(Message, pk=pk)

    if not user_can_access(msg, request.user):
        return HttpResponseForbidden("Not allowed")

    msg.delete()
    return redirect("trash")
