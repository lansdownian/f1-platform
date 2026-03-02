from ninja import NinjaAPI
api = NinjaAPI(title="F1 Platform API", version="1.0.0")
from apps.f1data.f1data import router as f1data_router


api.add_router("/f1data/", f1data_router)