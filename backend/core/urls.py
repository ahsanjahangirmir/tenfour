from django.urls import path

from .views import GenerateLogsView, PresetListView, TripDetailView, TripListCreateView

urlpatterns = [
    path("trips/", TripListCreateView.as_view(), name="trip-list-create"),
    path("trips/<uuid:pk>/", TripDetailView.as_view(), name="trip-detail"),
    path("trips/<uuid:pk>/generate-logs/", GenerateLogsView.as_view(), name="trip-generate-logs"),
    path("presets/", PresetListView.as_view(), name="preset-list"),
]
