# projects/views.py

from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.http import HttpResponseForbidden

from .models import Project, ProjectMessage
from .forms import ProjectForm, ProjectMessageForm


# ---------------------------------------
# PROJECT LIST (only user’s own projects)
# ---------------------------------------
@login_required
def project_list(request):
    projects = Project.objects.filter(owner=request.user).order_by("-created_at")
    return render(request, "projects/project_list.html", {"projects": projects})


# ---------------------------------------
# CREATE PROJECT
# ---------------------------------------
@login_required
def project_create(request):
    if request.method == "POST":
        form = ProjectForm(request.POST)
        if form.is_valid():
            project = form.save(commit=False)
            project.owner = request.user
            project.save()
            return redirect("project_list")
    else:
        form = ProjectForm()

    return render(request, "projects/project_form.html", {
        "form": form,
        "title": "Create Project",
    })


# ---------------------------------------
# EDIT PROJECT (owner only)
# ---------------------------------------
@login_required
def project_edit(request, pk):
    project = get_object_or_404(Project, pk=pk, owner=request.user)

    if request.method == "POST":
        form = ProjectForm(request.POST, instance=project)
        if form.is_valid():
            form.save()
            return redirect("project_detail", pk=project.pk)
    else:
        form = ProjectForm(instance=project)

    return render(request, "projects/project_form.html", {
        "form": form,
        "title": "Edit Project",
    })


# ---------------------------------------
# DELETE PROJECT (owner only)
# ---------------------------------------
@login_required
def project_delete(request, pk):
    project = get_object_or_404(Project, pk=pk, owner=request.user)
    project.delete()
    return redirect("project_list")


# ---------------------------------------
# PROJECT DETAIL + PROJECT MESSAGES
# ---------------------------------------
@login_required
def project_detail(request, pk):
    project = get_object_or_404(Project, pk=pk, owner=request.user)

    # Only show unarchived messages
    messages = project.messages.filter(archived=False).order_by("-created_at")

    if request.method == "POST":
        # Create a new message for the project
        form = ProjectMessageForm(request.POST)
        if form.is_valid():
            msg = form.save(commit=False)
            msg.project = project
            msg.sender = request.user
            msg.save()
            return redirect("project_detail", pk=project.pk)
    else:
        form = ProjectMessageForm()

    return render(request, "projects/project_detail.html", {
        "project": project,
        "messages": messages,
        "message_form": form,
    })


# ---------------------------------------
# ARCHIVE PROJECT MESSAGE
# ---------------------------------------
@login_required
def project_message_archive(request, pk):
    msg = get_object_or_404(ProjectMessage, pk=pk)

    # Security: Only project owner may archive
    if msg.project.owner != request.user:
        return HttpResponseForbidden("Not allowed to archive this message.")

    msg.archived = True
    msg.save()
    return redirect("project_detail", pk=msg.project.pk)
