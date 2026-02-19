import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapPin, Search } from "lucide-react";

// Fix for default marker icon in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Component to handle map clicks and marker dragging
function LocationMarker({ position, setPosition }) {
  const markerRef = useRef(null);

  useMapEvents({
    click(e) {
      setPosition({
        lat: e.latlng.lat,
        lng: e.latlng.lng,
      });
    },
  });

  const eventHandlers = {
    dragend() {
      const marker = markerRef.current;
      if (marker != null) {
        const newPos = marker.getLatLng();
        setPosition({
          lat: newPos.lat,
          lng: newPos.lng,
        });
      }
    },
  };

  return position ? (
    <Marker
      position={[position.lat, position.lng]}
      draggable={true}
      eventHandlers={eventHandlers}
      ref={markerRef}
    />
  ) : null;
}

// Component to recenter map when position changes
function RecenterMap({ position }) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.setView([position.lat, position.lng], map.getZoom());
    }
  }, [position, map]);

  return null;
}

function MapPicker({ latitude, longitude, onLocationChange, city = "" }) {
  // Default to Morocco center if no coordinates provided
  const [position, setPosition] = useState(
    latitude && longitude
      ? { lat: latitude, lng: longitude }
      : { lat: 33.5731, lng: -7.5898 }, // Casablanca, Morocco
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [mapKey, setMapKey] = useState(0);
  const onLocationChangeRef = useRef(onLocationChange);

  // Keep the ref updated
  useEffect(() => {
    onLocationChangeRef.current = onLocationChange;
  }, [onLocationChange]);

  // Update parent component when position changes
  useEffect(() => {
    if (position && onLocationChangeRef.current) {
      onLocationChangeRef.current(position.lat, position.lng);
    }
  }, [position]);

  // Set initial position based on city if provided
  useEffect(() => {
    if (city && !latitude && !longitude) {
      const cityCoordinates = getCityCoordinates(city);
      if (cityCoordinates) {
        setPosition(cityCoordinates);
        setMapKey((prev) => prev + 1); // Force map remount with new center
      }
    }
  }, [city, latitude, longitude]);

  // Simple city coordinates lookup (for Morocco)
  const getCityCoordinates = (cityName) => {
    const cities = {
      casablanca: { lat: 33.5731, lng: -7.5898 },
      rabat: { lat: 33.9716, lng: -6.8498 },
      marrakech: { lat: 31.6295, lng: -7.9811 },
      fes: { lat: 34.0181, lng: -5.0078 },
      tanger: { lat: 35.7595, lng: -5.834 },
      agadir: { lat: 30.4278, lng: -9.5981 },
      meknes: { lat: 33.8935, lng: -5.5473 },
      oujda: { lat: 34.6814, lng: -1.9086 },
      kenitra: { lat: 34.261, lng: -6.5802 },
      tetouan: { lat: 35.5785, lng: -5.3684 },
    };

    const normalizedCity = cityName.toLowerCase().trim();
    return cities[normalizedCity] || null;
  };

  // Search for location using Nominatim (OpenStreetMap) API
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery + ", Morocco",
        )}&limit=5`,
      );
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectResult = (result) => {
    setPosition({
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
    });
    setSearchResults([]);
    setSearchQuery("");
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Rechercher un emplacement
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Rechercher une adresse ou un lieu..."
              className="w-full border border-gray-300 rounded-lg px-4 py-2 pl-10 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <Search
              className="absolute left-3 top-2.5 text-gray-400"
              size={20}
            />
          </div>
          <button
            type="button"
            onClick={handleSearch}
            disabled={isSearching}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            {isSearching ? "..." : "Rechercher"}
          </button>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto bg-white shadow-lg">
            {searchResults.map((result, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSelectResult(result)}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
              >
                <div className="text-sm font-medium text-gray-900">
                  {result.display_name}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map Container */}
      <div className="border border-gray-300 rounded-lg overflow-hidden">
        <MapContainer
          key={mapKey}
          center={[position.lat, position.lng]}
          zoom={13}
          style={{ height: "400px", width: "100%" }}
          className="z-0"
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker position={position} setPosition={setPosition} />
          <RecenterMap position={position} />
        </MapContainer>
      </div>

      {/* Coordinates Display */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <MapPin className="text-primary-600 mt-0.5" size={20} />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-700 mb-1">
              Position sélectionnée
            </p>
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <span className="font-medium">Latitude:</span>{" "}
                {position.lat.toFixed(6)}
              </div>
              <div>
                <span className="font-medium">Longitude:</span>{" "}
                {position.lng.toFixed(6)}
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              💡 Cliquez sur la carte ou faites glisser le marqueur pour ajuster
              l'emplacement
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MapPicker;
