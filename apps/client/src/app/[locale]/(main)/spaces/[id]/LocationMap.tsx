"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { MapContainer, TileLayer, Marker, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const MapViewUpdater = ({ latitude, longitude }: { latitude: number; longitude: number }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([latitude, longitude]);
  }, [map, latitude, longitude]);
  return null;
};

const orangePin = L.divIcon({
  className: "",
  html: `<svg width="32" height="42" viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 0C7.163 0 0 7.163 0 16c0 12 16 26 16 26s16-14 16-26C32 7.163 24.837 0 16 0z" fill="#F27A2E"/>
    <circle cx="16" cy="16" r="6" fill="white"/>
  </svg>`,
  iconSize: [32, 42],
  iconAnchor: [16, 42],
});

interface LocationMapProps {
  latitude: number;
  longitude: number;
  address: string;
}

const LocationMap = ({ latitude, longitude, address }: LocationMapProps) => {
  const t = useTranslations("spaces");

  return (
    <div>
      <h2 className="text-xl font-bold text-foreground mb-4">{t("location")}</h2>
      <div className="h-[300px] rounded-xl overflow-hidden">
        <MapContainer
          center={[latitude, longitude]}
          zoom={15}
          scrollWheelZoom={true}
          dragging={true}
          zoomControl={true}
          doubleClickZoom={true}
          touchZoom={true}
          attributionControl={true}
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={[latitude, longitude]} icon={orangePin} />
          <Circle
            center={[latitude, longitude]}
            radius={200}
            pathOptions={{
              color: "#F27A2E",
              fillColor: "#F27A2E",
              fillOpacity: 0.12,
              weight: 1,
            }}
          />
          <MapViewUpdater latitude={latitude} longitude={longitude} />
        </MapContainer>
      </div>
      <p className="text-sm text-muted mt-2">{address}</p>
    </div>
  );
};

export default LocationMap;
