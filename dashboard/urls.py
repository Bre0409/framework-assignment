
from django.urls import path
from . import views

urlpatterns = [
    path("", views.home, name="home"),

    path("goals/", views.goals, name="goals"),
    path("tasks/", views.tasks, name="tasks"),
    path("settings/", views.settings_view, name="settings"),
    

    # Goals API
    path("api/goals/toggle/<int:pk>/", views.goal_toggle_select, name="goal_toggle"),
    path("api/goals/progress/<int:pk>/", views.goal_update_progress, name="goal_update"),
    path("api/goals/create/", views.goal_create, name="goal_create"),
    path("api/goals/delete/<int:pk>/", views.goal_delete, name="goal_delete"),
    path("api/goals/reorder/", views.goal_reorder, name="goal_reorder"),

    # Tasks API
    path("api/tasks/create/", views.task_create, name="task_create"),
    path("api/tasks/toggle/<int:pk>/", views.task_toggle, name="task_toggle"),
    path("api/tasks/delete/<int:pk>/", views.task_delete, name="task_delete"),

    # Notes API
    path("api/notes/create/", views.note_create, name="note_create"),
    path("api/notes/delete/<int:pk>/", views.note_delete, name="note_delete"),
]
