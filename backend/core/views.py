from rest_framework import status
from rest_framework.generics import ListAPIView, ListCreateAPIView, RetrieveDestroyAPIView, UpdateAPIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .adapters.routing import GeocodeError
from .models import Trip, TripPreset
from .serializers import (
    GenerateLogsSerializer,
    TripCreateSerializer,
    TripDetailSerializer,
    TripListSerializer,
    TripPresetSerializer,
)
from .services.log_sheet import LogSheetService
from .services.trip_simulation import InvalidTripError, TripSimulationService


class TripListCreateView(ListCreateAPIView):
    """GET lists the signed-in user's trip history. POST runs Phase 1:
    simulate the trip from the four minimal inputs, persist it, and
    return the route, stops, and breakdown — docs/spec.md section 6."""

    def get_queryset(self):
        return Trip.objects.filter(user=self.request.user)

    def get_serializer_class(self):
        return TripCreateSerializer if self.request.method == "POST" else TripListSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        try:
            trip = TripSimulationService().create_trip(
                user=request.user,
                current_text=data["current_location_text"],
                pickup_text=data["pickup_location_text"],
                dropoff_text=data["dropoff_location_text"],
                current_cycle_used_hours=data["current_cycle_used_hours"],
                trip_start_datetime=data["trip_start_datetime"],
            )
        except (GeocodeError, InvalidTripError) as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(TripDetailSerializer(trip).data, status=status.HTTP_201_CREATED)


class TripDetailView(RetrieveDestroyAPIView):
    """Full detail for one trip: route, schedule blocks, breakdown, and
    log sheets if generated. DELETE removes it from the signed-in user's
    history."""

    serializer_class = TripDetailSerializer

    def get_queryset(self):
        return Trip.objects.filter(user=self.request.user)


class GenerateLogsView(UpdateAPIView):
    """PATCH runs Phase 2: accept the trip-specific fields, snapshot the
    profile, batch-reverse-geocode stops, compute LogSheet rows, and set
    logs_generated = true."""

    http_method_names = ["patch"]

    def get_queryset(self):
        return Trip.objects.filter(user=self.request.user)

    def update(self, request, *args, **kwargs):
        trip = self.get_object()
        serializer = GenerateLogsSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        trip = LogSheetService().generate_logs(
            trip,
            driver_number=data["driver_number"],
            driver_full_name=data["driver_full_name"],
            truck_number=data["truck_number"],
            trailer_number=data["trailer_number"],
            carrier_name=data["carrier_name"],
            carrier_address=data["carrier_address"],
            time_base=data["time_base"],
            shipping_document_number=data.get("shipping_document_number", ""),
            shipper_name=data.get("shipper_name", ""),
            commodity=data.get("commodity", ""),
            co_driver_name=data.get("co_driver_name", ""),
        )
        return Response(TripDetailSerializer(trip).data)


class PresetListView(ListAPIView):
    """Lists the available trip presets. Unlike every other endpoint,
    this one doesn't require sign-in — per docs/spec.md section 6, a
    visitor should be able to see what's on offer before creating an
    account."""

    queryset = TripPreset.objects.all()
    serializer_class = TripPresetSerializer
    authentication_classes = []
    permission_classes = [AllowAny]
