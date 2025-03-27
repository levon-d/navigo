import React, { useEffect, useState } from "react";
import { Navigation, MapIcon } from "lucide-react";

export default function NearestLocations({
  activeLayers,
  userLocation,
  zebraCrossingMarkersRef,
  wheelchairServiceMarkersRef, // Add this new prop
  dataLayers, // Add this new prop
  colorMode,
  isDyslexicFont,
  fontSize,
  onNavigate,
  onCenterMap,
}) {
  // Track nearest locations with state
  const [nearestLocations, setNearestLocations] = useState([]);

  // Calculate distance
  const calculateDistance = (coord1, coord2) => {
    const R = 6371000; // Earth's radius in meters
    const lat1 = (coord1.lat * Math.PI) / 180;
    const lat2 = (coord2.lat * Math.PI) / 180;
    const deltaLat = ((coord2.lat - coord1.lat) * Math.PI) / 180;
    const deltaLng = ((coord2.lng - coord1.lng) * Math.PI) / 180;

    const a =
      Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
      Math.cos(lat1) *
        Math.cos(lat2) *
        Math.sin(deltaLng / 2) *
        Math.sin(deltaLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Format distance for display
  const formatDistance = (meters) => {
    return meters < 1000
      ? `${Math.round(meters)}m`
      : `${(meters / 1000).toFixed(1)}km`;
  };

  // Update nearest locations whenever active layers or location changes
  useEffect(() => {
    let locations = [];

    // Process each active layer
    Object.entries(activeLayers).forEach(([layerId, isActive]) => {
      if (!isActive) return;

      const layerConfig = dataLayers[layerId];
      if (!layerConfig) return;

      if (
        layerId === "zebraCrossings" &&
        zebraCrossingMarkersRef.current?.length > 0
      ) {
        const zebraCrossings = zebraCrossingMarkersRef.current
          .filter((marker) => marker.getMap() !== null)
          .map((marker) => {
            const position = marker.getPosition();
            if (!position) return null;

            return {
              type: layerId,
              name: layerConfig.name,
              emoji: layerConfig.emoji,
              position: { lat: position.lat(), lng: position.lng() },
              distance: calculateDistance(userLocation, {
                lat: position.lat(),
                lng: position.lng(),
              }),
              marker: marker,
            };
          })
          .filter((item) => item !== null);

        locations = [...locations, ...zebraCrossings];
      } else if (
        layerId === "wheelchairServices" &&
        wheelchairServiceMarkersRef.current?.length > 0
      ) {
        const wheelchairMarkers = wheelchairServiceMarkersRef.current
          .filter((marker) => marker.getMap() !== null)
          .map((marker) => {
            const position = marker.getPosition();
            if (!position) return null;

            return {
              type: layerId,
              name: layerConfig.name,
              emoji: layerConfig.emoji,
              position: { lat: position.lat(), lng: position.lng() },
              distance: calculateDistance(userLocation, {
                lat: position.lat(),
                lng: position.lng(),
              }),
              marker: marker,
            };
          })
          .filter((item) => item !== null);

        locations = [...locations, ...wheelchairMarkers];
      }
      // Future layers can be added here
    });

    // Sort by distance and take the top 3
    const nearest = locations
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 3);

    setNearestLocations(nearest);
  }, [
    activeLayers,
    userLocation,
    zebraCrossingMarkersRef.current?.length,
    wheelchairServiceMarkersRef.current?.length,
    dataLayers,
  ]);

  // If no layers are active or no locations found, return null
  if (
    Object.values(activeLayers).every((active) => !active) ||
    nearestLocations.length === 0
  ) {
    return null;
  }

  // Get appropriate styling based on color mode
  const getCardStyles = () => {
    if (colorMode === "dark") {
      return "bg-gray-800 text-yellow-300 border-gray-700";
    } else if (colorMode === "yellow") {
      return "bg-yellow-50 border-yellow-200 text-yellow-900";
    }
    return "bg-white border-gray-200";
  };

  // Get appropriate button styles based on color mode
  const getButtonStyles = (primary = false) => {
    if (colorMode === "dark") {
      return primary
        ? "bg-blue-700 hover:bg-blue-600 text-yellow-300"
        : "bg-gray-700 hover:bg-gray-600 text-yellow-300";
    } else if (colorMode === "yellow") {
      return primary
        ? "bg-yellow-600 hover:bg-yellow-500 text-white"
        : "bg-yellow-200 hover:bg-yellow-300 text-yellow-900";
    }
    return primary
      ? "bg-primary hover:bg-blue-600 text-white"
      : "bg-gray-100 hover:bg-gray-200 text-gray-800";
  };

  // Enhanced view handler to trigger marker info window
  // Enhanced view handler to trigger marker info window
  const handleView = (location) => {
    // First center the map
    onCenterMap(location.position);

    // Try to trigger the marker's info window if available
    if (location.marker) {
      // Simulate a click on the marker to open its info window
      google.maps.event.trigger(location.marker, "click");
    }
  };

  return (
    <div className="flex space-x-3 justify-between">
      {nearestLocations.map((location, index) => (
        <div
          key={index}
          className={`rounded-lg border shadow-sm ${getCardStyles()} w-[32%] min-w-[250px]`}
        >
          <div className="p-2">
            <h4 className="font-medium text-base truncate">
              {location.emoji} {location.name}
            </h4>
            <p className="text-sm opacity-80">
              {formatDistance(location.distance)} away
            </p>
            <div className="flex justify-between mt-1.5">
              <button
                onClick={() => handleView(location)}
                className={`p-1.5 rounded ${getButtonStyles()} flex items-center text-sm`}
                aria-label="Center on map"
              >
                <MapIcon className="h-4 w-4 mr-1" />
                View
              </button>
              <button
                onClick={() => onNavigate(location.position)}
                className={`p-1.5 rounded ${getButtonStyles(
                  true
                )} flex items-center text-sm`}
                aria-label="Navigate"
              >
                <Navigation className="h-4 w-4 mr-1" />
                Navigate
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
