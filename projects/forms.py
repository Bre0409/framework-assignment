# projects/forms.py
from django import forms
from .models import Project, ProjectMessage

class ProjectForm(forms.ModelForm):
    start_date = forms.DateField(required=False, widget=forms.DateInput(attrs={"type": "date"}))
    end_date = forms.DateField(required=False, widget=forms.DateInput(attrs={"type": "date"}))

    class Meta:
        model = Project
        fields = ["name", "description", "start_date", "end_date", "stakeholders", "status"]
        widgets = {
            "description": forms.Textarea(attrs={"rows": 4}),
            "stakeholders": forms.TextInput(attrs={"placeholder": "Comma-separated names"}),
        }


class ProjectMessageForm(forms.ModelForm):
    class Meta:
        model = ProjectMessage
        fields = ["subject", "body"]
        widgets = {
            "subject": forms.TextInput(attrs={"class": "form-control"}),
            "body": forms.Textarea(attrs={"class": "form-control", "rows": 3}),
        }
