import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useMemo } from "react";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";

const DEFAULT_CENTER = [39.8, -98.5];
const DEFAULT_ZOOM = 4;
const LOCATED_ZOOM = 11;

const pulseIcon = L.divIcon({
  className: "dashboard-pulse-marker",
  html: '<span class="dashboard-pulse-marker__ring"></span><span class="dashboard-pulse-marker__dot"></span>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

function FlyToLocation({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, LOCATED_ZOOM, { duration: 1.4 });
    }
  }, [map, position]);
  return null;
}

export default function DashboardMap({ userLocation }) {
  const position = useMemo(
    () => (userLocation ? [userLocation.lat, userLocation.lon] : null),
    [userLocation],
  );

  return (
    <div className="dashboard-map">
      <MapContainer
        center={position ?? DEFAULT_CENTER}
        zoom={position ? LOCATED_ZOOM : DEFAULT_ZOOM}
        zoomControl={false}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FlyToLocation position={position} />
        {position && <Marker position={position} icon={pulseIcon} />}
      </MapContainer>
    </div>
  );
}
