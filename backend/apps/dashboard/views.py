
from apps.f1data.services.fastf1_service import get_latest_race_data
from inertia import inertia


@inertia('app/dashboard/Dashboard')
def dashboard(request):
    return get_latest_race_data()

# OR 

# def dashboard(request):
#     data = get_latest_race_data()
#     return render(request, "Dashboard", data)