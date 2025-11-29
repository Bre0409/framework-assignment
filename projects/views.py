# projects/views.py
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages

from .models import Project
from .forms import ProjectForm


# -----------------------------
# LIST
# -----------------------------
@login_required
def project_list(request):
    """
    Superusers: see ALL projects.
    Normal users: see projects they own or are a stakeholder on.
    """
    if request.user.is_superuser:
        projects = Project.objects.all()
    else:
        projects = (
            Project.objects.filter(owner=request.user)
            | Project.objects.filter(stakeholders=request.user)
        ).distinct()

    return render(request, "projects/project_list.html", {"projects": projects})


# -----------------------------
# DETAIL
# -----------------------------
@login_required
def project_detail(request, pk):
    """
    Superusers: can open any project.
    Normal users: only if owner or stakeholder.
    """
    project = get_object_or_404(Project, pk=pk)

    if not (
        request.user.is_superuser
        or project.owner == request.user
        or request.user in project.stakeholders.all()
    ):
        messages.error(request, "You do not have permission to view this project.")
        return redirect("project_list")

    return render(request, "projects/project_detail.html", {"project": project})


# -----------------------------
# CREATE
# -----------------------------
@login_required
def project_create(request):
    """
    Any authenticated user can create a project.
    The creator becomes the owner.
    """
    if request.method == "POST":
        form = ProjectForm(request.POST)
        if form.is_valid():
            project = form.save(commit=False)
            project.owner = request.user
            project.save()
            form.save_m2m()
            messages.success(request, "Project created successfully.")
            return redirect("project_list")
    else:
        form = ProjectForm()

    return render(
        request,
        "projects/project_form.html",
        {"form": form, "title": "Create Project"},
    )


# -----------------------------
# UPDATE
# -----------------------------
@login_required
def project_edit(request, pk):
    """
    Superusers: can edit any project.
    Normal users: only the owner.
    """
    project = get_object_or_404(Project, pk=pk)

    if not (request.user.is_superuser or project.owner == request.user):
        messages.error(request, "Only the project owner can edit this project.")
        return redirect("project_detail", pk=pk)

    if request.method == "POST":
        form = ProjectForm(request.POST, instance=project)
        if form.is_valid():
            form.save()
            messages.success(request, "Project updated successfully.")
            return redirect("project_detail", pk=pk)
    else:
        form = ProjectForm(instance=project)

    return render(
        request,
        "projects/project_form.html",
        {"form": form, "title": "Edit Project"},
    )


# -----------------------------
# DELETE
# -----------------------------
@login_required
def project_delete(request, pk):
    """
    Superusers: can delete any project.
    Normal users: only the owner.
    """
    project = get_object_or_404(Project, pk=pk)

    if not (request.user.is_superuser or project.owner == request.user):
        messages.error(request, "Only the project owner can delete this project.")
        return redirect("project_detail", pk=pk)

    project.delete()
    messages.success(request, "Project deleted.")
    return redirect("project_list")
