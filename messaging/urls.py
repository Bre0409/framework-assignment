# messaging/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path("inbox/", views.inbox, name="inbox"),
    path("sent/", views.sent_messages, name="sent_messages"),
    path("archived/", views.archived_messages, name="archived_messages"),
    path("trash/", views.trash, name="trash"),

    path("compose/", views.compose, name="compose_message"),
    path("<int:pk>/", views.message_detail, name="message_detail"),
    path("<int:pk>/reply/", views.reply_message, name="reply_message"),

    path("<int:pk>/delete/", views.message_delete, name="message_delete"),
    path("<int:pk>/restore/", views.message_restore, name="message_restore"),
]
