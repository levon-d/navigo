import React, { useState, useEffect, useRef } from "react";
import { WidgetConfig } from "../types";

export interface AccessibleMapWidgetProps {
  config: WidgetConfig;
  className?: string;
}

const AccessibleMapWidget: React.FC<AccessibleMapWidgetProps> = ({
  config,
  className = "",
}) => {
  const [colorMode, setColorMode] = useState(
    config.initialColorMode || "light",
  );
  const [userLocation, setUserLocation] = useState(
    config.defaultLocation || { lat: 51.507401, lng: -0.127758 },
  );

  const googleMapsApiKey = config.apiKeys.googleMaps;
  const what3wordsApiKey = config.apiKeys.what3words;
  const azureSpeechApiKey = config.apiKeys.azureSpeech;
  const dataLayersApiKey = config.apiKeys.dataLayersApi;

  const dataLayersApiUrl =
    config.dataLayersApiUrl ||
    "https://datalayersforaccessibilityapi.azurewebsites.net/v1";

  const [activeLayers, setActiveLayers] = useState({
    zebraCrossings: config.initialActiveLayers?.zebraCrossings || false,
    wheelchairServices: config.initialActiveLayers?.wheelchairServices || false,
  });

  // ... rest of your component code ...

  // Update API calls to use the configured values
  const fetchNearbyLocations = async (lat: number, lng: number) => {
    try {
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      // Add API key to headers if provided
      headers["X-API-KEY"] = `${dataLayersApiKey}`;

      const response = await fetch(
        `${dataLayersApiUrl}/locations/nearby?latitude=${lat}&longitude=${lng}&radius=500`,
        { headers },
      );

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching nearby locations:", error);
      return [];
    }
  };

  // Update the report submission function
  const submitAccessibilityReport = async (
    locationId: string,
    reportData: any,
  ) => {
    try {
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      // Add API key to headers if provided
      headers["Authorization"] = `Bearer ${dataLayersApiKey}`;

      return fetch(`${dataLayersApiUrl}/locations/${locationId}/reports`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(reportData),
      });
    } catch (error) {
      console.error("Error sending report to API:", error);
      throw error;
    }
  };

  // Update what3words API calls
  const fetchWhat3Words = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://api.what3words.com/v3/convert-to-3wa?coordinates=${lat},${lng}&key=${what3wordsApiKey}`,
      );
      return await response.json();
    } catch (error) {
      console.error("Error fetching what3words:", error);
      return null;
    }
  };

  // Update Google Maps script loading
  const loadGoogleMapsScript = () => {
    if (window.google) {
      initMap();
      return Promise.resolve();
    }

    window.initMap = initMap;

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=places&callback=initMap`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    return new Promise<void>((resolve) => {
      script.onload = () => resolve();
    });
  };

  // Update handleSubmitFeatures to use the new API call
  const handleSubmitFeatures = async () => {
    // ... existing code ...

    try {
      // ... existing code ...

      // Updated API call
      await submitAccessibilityReport(currentReportLocationId, reportData);

      // ... rest of existing code ...
    } catch (error) {
      // ... existing error handling ...
    }
  };

  // ... rest of your component code ...

  return (
    <div className={`accessibility-map-widget ${className}`}>
      {/* Your existing JSX */}
    </div>
  );
};

export default AccessibleMapWidget;
