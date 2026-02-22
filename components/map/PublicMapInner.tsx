"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type Place = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  linkedPosts: { id: string; title: string; slug: string }[];
  linkedAlbums: { id: string; title: string; slug: string }[];
};

const bluePin = () =>
  L.divIcon({
    html: `<svg width="24" height="36" viewBox="0 0 24 36" xmlns="http://www.w3.org/2000/svg"><path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 24 12 24s12-15 12-24C24 5.373 18.627 0 12 0z" fill="#3182F6"/><circle cx="12" cy="12" r="5" fill="white"/></svg>`,
    iconSize: [24, 36],
    iconAnchor: [12, 36],
    popupAnchor: [0, -38],
    className: "",
  });

export default function PublicMapInner({ places }: { places: Place[] }) {
  const center: [number, number] =
    places.length > 0 ? [places[0].lat, places[0].lng] : [36.5, 127.9];

  return (
    <MapContainer
      center={center}
      zoom={places.length > 0 ? 9 : 7}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {places.map((place) => (
        <Marker key={place.id} position={[place.lat, place.lng]} icon={bluePin()}>
          <Popup>
            <div style={{ minWidth: 160 }}>
              <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>{place.name}</p>
              {place.linkedPosts.map((post) => (
                <a
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  style={{ display: "block", fontSize: 13, color: "#3182F6", marginBottom: 4 }}
                >
                  📝 {post.title}
                </a>
              ))}
              {place.linkedAlbums.map((album) => (
                <a
                  key={album.id}
                  href={`/albums/${album.slug}`}
                  style={{ display: "block", fontSize: 13, color: "#3182F6", marginBottom: 4 }}
                >
                  📸 {album.title}
                </a>
              ))}
              {place.linkedPosts.length === 0 && place.linkedAlbums.length === 0 && (
                <p style={{ fontSize: 12, color: "#8B95A1" }}>연결된 콘텐츠 없음</p>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
