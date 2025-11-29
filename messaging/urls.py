from django.urls import path
from . import views

urlpatterns = [
    # Inbox
    path("inbox/", views.inbox, name="inbox"),

    # Sent
    path("sent/", views.sent, name="sent_messages"),

    # Archived
    path("archive/", views.archived, name="archived_messages"),

    # Trash
    path("trash/", views.trash, name="trash"),

    # Compose
    path("compose/", views.compose, name="compose_message"),

    # Message detail
    path("message/<int:pk>/", views.message_detail, name="message_detail"),

    # Message actions
    path("message/<int:pk>/archive/", views.toggle_archive, name="toggle_archive"),
    path("message/<int:pk>/delete/", views.delete_message, name="delete_message"),
    path("message/<int:pk>/restore/", views.restore_message, name="restore_message"),
    path("message/<int:pk>/permanent-delete/", views.permanent_delete, name="permanent_delete"),
]
