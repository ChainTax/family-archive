"use client";

import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type Place = {
  id: string;
  name: string;
  lat: number;
  lng: number;
};

type Props = {
  places: Place[];
  addMode: boolean;
  onMapClick: (lat: number, lng: number) => void;
  onMarkerClick: (id: string) => void;
  pendingLat?: number | null;
  pendingLng?: number | null;
};

const bluePin = () =>
  L.divIcon({
    html: `<svg width="24" height="36" viewBox="0 0 24 36" xmlns="http://www.w3.org/2000/svg"><path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 24 12 24s12-15 12-24C24 5.373 18.627 0 12 0z" fill="#3182F6"/><circle cx="12" cy="12" r="5" fill="white"/></svg>`,
    iconSize: [24, 36],
    iconAnchor: [12, 36],
    popupAnchor: [0, -38],
    className: "",
  });

const pendingPin = () =>
  L.divIcon({
    html: `<svg width="24" height="36" viewBox="0 0 24 36" xmlns="http://www.w3.org/2000/svg"><path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 24 12 24s12-15 12-24C24 5.373 18.627 0 12 0z" fill="#FF6B35"/><circle cx="12" cy="12" r="5" fill="white"/></svg>`,
    iconSize: [24, 36],
    iconAnchor: [12, 36],
    popupAnchor: [0, -38],
    className: "",
  });

function MapClickHandler({
  addMode,
  onMapClick,
}: {
  addMode: boolean;
  onMapClick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      if (addMode) onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function AdminMapInner({
  places,
  addMode,
  onMapClick,
  onMarkerClick,
  pendingLat,
  pendingLng,
}: Props) {
  const center: [number, number] =
    places.length > 0 ? [places[0].lat, places[0].lng] : [36.5, 127.9];

  return (
    <MapContainer
      center={center}
      zoom={places.length > 0 ? 10 : 7}
      style={{
        height: "100%",
        width: "100%",
        cursor: addMode ? "crosshair" : "grab",
      }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapClickHandler addMode={addMode} onMapClick={onMapClick} />

      {places.map((place) => (
        <Marker
          key={place.id}
          position={[place.lat, place.lng]}
          icon={bluePin()}
          eventHandlers={{ click: () => onMarkerClick(place.id) }}
        />
      ))}

      {pendingLat != null && pendingLng != null && (
        <Marker position={[pendingLat, pendingLng]} icon={pendingPin()} />
      )}
    </MapContainer>
  );
}
