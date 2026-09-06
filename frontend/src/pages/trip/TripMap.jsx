import "leaflet/dist/leaflet.css";
import { useEffect, useMemo } from "react";
import { CircleMarker, MapContainer, Polyline, Popup, TileLayer, useMap } from "react-leaflet";
import { styleForBlock, STOP_STYLES } from "../../lib/stopStyles";

const STOP_TYPES_ON_MAP = new Set([
  "pickup",
  "dropoff",
  "fuel_stop",
  "30min_break",
  "10hr_rest",
  "34hr_restart",
]);

function FitBounds({ positions }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length > 0) {
      map.fitBounds(positions, { padding: [96, 96] });
    }
  }, [map, positions]);
  return null;
}

export default function TripMap({ trip }) {
  const routeLine = trip.route_geometry;

  const stops = useMemo(() => {
    const markers = [
      {
        key: "current",
        lat: trip.current_lat,
        lon: trip.current_lon,
        style: STOP_STYLES.current,
        label: trip.current_location_text,
      },
    ];
    for (const block of trip.schedule_blocks) {
      if (!STOP_TYPES_ON_MAP.has(block.stop_type)) continue;
      markers.push({
        key: block.id,
        lat: block.start_lat,
        lon: block.start_lon,
        style: styleForBlock(block),
        label: block.remark_location_text || styleForBlock(block).label,
      });
    }
    return markers;
  }, [trip]);

  const boundsPositions = routeLine.length > 0 ? routeLine : stops.map((s) => [s.lat, s.lon]);

  return (
    <div className="dashboard-map">
      <MapContainer
        center={[trip.current_lat, trip.current_lon]}
        zoom={6}
        zoomControl={false}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds positions={boundsPositions} />
        {routeLine.length > 0 && (
          <Polyline positions={routeLine} pathOptions={{ color: "#ff4162", weight: 4 }} />
        )}
        {stops.map((stop) => (
          <CircleMarker
            key={stop.key}
            center={[stop.lat, stop.lon]}
            radius={8}
            pathOptions={{ color: stop.style.color, fillColor: stop.style.color, fillOpacity: 0.95, weight: 2 }}
          >
            <Popup>
              <strong>{stop.style.label}</strong>
              <br />
              {stop.label}
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
