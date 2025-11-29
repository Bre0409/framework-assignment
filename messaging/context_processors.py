# messaging/context_processors.py
from .models import Message

def messaging_unread_counts(request):
    if not request.user.is_authenticated:
        return {"inbox_unread_count": 0}

    unread_count = Message.objects.filter(
        recipient=request.user,
        archived=False,
        is_read=False,
        deleted_by_recipient=False,
    ).count()

    return {"inbox_unread_count": unread_count}
