from django import forms
from .models import Project
from django.contrib.auth.models import User

class ProjectForm(forms.ModelForm):

    stakeholders = forms.ModelMultipleChoiceField(
        queryset=User.objects.all(),
        required=False,
        label="Stakeholders",
        widget=forms.SelectMultiple(attrs={"class": "form-control"})
    )

    class Meta:
        model = Project
        fields = [
            "name", "description",
            "start_date", "end_date",
            "status", "stakeholders"
        ]

        widgets = {
            "name": forms.TextInput(attrs={"class": "form-control"}),
            "description": forms.Textarea(attrs={"class": "form-control", "rows": 4}),
            "start_date": forms.DateInput(attrs={"type": "date", "class": "form-control"}),
            "end_date": forms.DateInput(attrs={"type": "date", "class": "form-control"}),
            "status": forms.Select(attrs={"class": "form-control"}),
        }
