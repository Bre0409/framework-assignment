# messaging/views.py
from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.db.models import Q

from .models import Message
from .forms import MessageForm


# 📥 INBOX
@login_required
def inbox(request):
    messages = Message.objects.filter(
        recipient=request.user,
        archived=False,
        deleted_by_recipient=False
    ).order_by("-created_at")

    return render(request, "messaging/inbox.html", {"messages": messages})


# 📤 SENT
@login_required
def sent_messages(request):
    messages = Message.objects.filter(
        sender=request.user,
        deleted_by_sender=False
    ).order_by("-created_at")

    return render(request, "messaging/sent.html", {"messages": messages})


# 🗄 ARCHIVED
@login_required
def archived_messages(request):
    messages = Message.objects.filter(
        archived=True
    ).filter(
        Q(sender=request.user, deleted_by_sender=False) |
        Q(recipient=request.user, deleted_by_recipient=False)
    ).order_by("-created_at")

    return render(request, "messaging/archived.html", {"messages": messages})


# 🗑 TRASH
@login_required
def trash(request):
    messages = Message.objects.filter(
        Q(sender=request.user, deleted_by_sender=True) |
        Q(recipient=request.user, deleted_by_recipient=True)
    ).order_by("-created_at")

    return render(request, "messaging/trash.html", {"messages": messages})


# 📝 COMPOSE
@login_required
def compose(request):
    if request.method == "POST":
        form = MessageForm(request.POST, request.FILES)
        if form.is_valid():
            msg = form.save(commit=False)
            msg.sender = request.user
            msg.save()
            return redirect("sent_messages")
    else:
        form = MessageForm()

    return render(request, "messaging/compose.html", {"form": form})


# 🔁 REPLY
@login_required
def reply_message(request, pk):
    original = get_object_or_404(
        Message,
        Q(pk=pk) & (Q(sender=request.user) | Q(recipient=request.user))
    )

    reply_to = original.sender if request.user == original.recipient else original.recipient

    if request.method == "POST":
        form = MessageForm(request.POST, request.FILES)
        if form.is_valid():
            msg = form.save(commit=False)
            msg.sender = request.user
            msg.recipient = reply_to
            msg.save()
            return redirect("sent_messages")
    else:
        initial = {
            "recipient": reply_to,
            "subject": f"Re: {original.subject}",
            "body": f"\n\n--- Original Message ---\n{original.body}",
        }
        form = MessageForm(initial=initial)

    return render(request, "messaging/compose.html", {
        "form": form,
        "reply_to": reply_to,
        "original": original,
    })


# 📄 MESSAGE DETAIL
@login_required
def message_detail(request, pk):
    msg = get_object_or_404(
        Message,
        Q(pk=pk) & (Q(sender=request.user) | Q(recipient=request.user))
    )

    # Mark as read
    if msg.recipient == request.user and not msg.is_read:
        msg.is_read = True
        msg.save()

    return render(request, "messaging/message_detail.html", {"msg": msg})


# 🗑 SOFT DELETE
@login_required
def message_delete(request, pk):
    msg = get_object_or_404(
        Message,
        Q(pk=pk) & (Q(sender=request.user) | Q(recipient=request.user))
    )

    if request.user == msg.sender:
        msg.deleted_by_sender = True
    if request.user == msg.recipient:
        msg.deleted_by_recipient = True

    msg.save()
    return redirect("trash")


# ♻ RESTORE
@login_required
def message_restore(request, pk):
    msg = get_object_or_404(
        Message,
        Q(pk=pk) & (Q(sender=request.user) | Q(recipient=request.user))
    )

    if request.user == msg.sender:
        msg.deleted_by_sender = False
    if request.user == msg.recipient:
        msg.deleted_by_recipient = False

    msg.save()
    return redirect("trash")
