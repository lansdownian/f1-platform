# views.py

from inertia import render

def dashboard(request):
    return render(request, "app/dashboard/Dashboard")