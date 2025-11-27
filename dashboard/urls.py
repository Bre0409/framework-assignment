from django.urls import path
from . import views

urlpatterns = [
    path("", views.home, name="home"),

    # Goals
    path("goals/", views.goals, name="goals"),
    path("api/goals/data/", views.goals_data, name="goals_data"),
    path("api/goals/save-selection/", views.goals_save_selection, name="goals_save_selection"),
    path("api/goals/progress/<int:pk>/", views.goal_update_progress, name="goal_update_progress"),
    path("api/goals/toggle/<int:pk>/", views.goal_toggle, name="goal_toggle"),
    path("api/goals/delete/<int:pk>/", views.goal_delete, name="goal_delete"),
    path("api/goals/reorder/", views.goal_reorder, name="goal_reorder"),

    # Tasks
    path("tasks/", views.tasks, name="tasks"),
    path("api/tasks/list/", views.tasks_list, name="tasks_list"),
    path("api/tasks/save-selection/", views.tasks_save_selection, name="tasks_save_selection"),
    path("api/tasks/toggle/<int:pk>/", views.task_toggle, name="task_toggle"),
    path("api/tasks/delete/<int:pk>/", views.task_delete, name="task_delete"),

    # Settings ✅
    path("settings/", views.settings_view, name="settings"),
]
