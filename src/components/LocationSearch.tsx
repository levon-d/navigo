"use client";
import React, { useState, useEffect, useRef } from "react";
import { Input } from "src/components/ui/input";
import { Button } from "src/components/ui/button";
import { SearchIcon, MapPinIcon } from "lucide-react";
import { Card } from "src/components/ui/card";
import _ from "lodash";

interface SearchProps {
  onLocationSelect: (location: { lat: number; lng: number }) => void;
  colorMode: "light" | "dark" | "yellow";
  isDyslexicFont: boolean;
}

export default function LocationSearch({
  onLocationSelect,
  colorMode,
  isDyslexicFont,
}: SearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Function to get What3Words suggestions
  const getWhat3WordsSuggestions = async (input: string) => {
    try {
      const response = await fetch(
        `https://api.what3words.com/v3/autosuggest?input=${input}&key=${process.env.NEXT_PUBLIC_W3W_API_KEY}`,
      );
      const data = await response.json();

      if (data.suggestions) {
        return data.suggestions.map((suggestion: any) => ({
          description: `${suggestion.words} (What3Words)`,
          words: suggestion.words,
          isW3W: true,
        }));
      }
      return [];
    } catch (error) {
      console.error("Error getting W3W suggestions:", error);
      return [];
    }
  };

  // Function to convert What3Words to coordinates
  const convertWhat3WordsToCoordinates = async (words: string) => {
    try {
      const response = await fetch(
        `https://api.what3words.com/v3/convert-to-coordinates?words=${words}&key=${process.env.NEXT_PUBLIC_W3W_API_KEY}`,
      );
      const data = await response.json();

      if (data.coordinates) {
        return {
          lat: data.coordinates.lat,
          lng: data.coordinates.lng,
        };
      }
      return null;
    } catch (error) {
      console.error("Error converting W3W to coordinates:", error);
      return null;
    }
  };

  // Function to handle UK postcode search
  const searchPostcode = async (postcode: string) => {
    try {
      const response = await fetch(
        `https://api.postcodes.io/postcodes/${postcode}`,
      );
      const data = await response.json();

      if (data.result) {
        return [
          {
            description: `${postcode} (Postcode)`,
            location: {
              lat: parseFloat(data.result.latitude),
              lng: parseFloat(data.result.longitude),
            },
          },
        ];
      }
      return [];
    } catch (error) {
      console.error("Error searching postcode:", error);
      return [];
    }
  };

  // Function to handle Google Places search
  const searchGooglePlaces = async (query: string) => {
    return new Promise((resolve) => {
      const service = new google.maps.places.AutocompleteService();
      service.getPlacePredictions(
        {
          input: query,
          componentRestrictions: { country: "gb" },
        },
        (predictions, status) => {
          if (
            status === google.maps.places.PlacesServiceStatus.OK &&
            predictions
          ) {
            resolve(
              predictions.map((prediction) => ({
                description: prediction.description,
                place_id: prediction.place_id,
              })),
            );
          } else {
            resolve([]);
          }
        },
      );
    });
  };

  // Debounced search function for suggestions
  const debouncedSearch = useRef(
    _.debounce(async (query: string) => {
      if (query.length < 1) {
        setSearchResults([]);
        return;
      }

      setIsLoading(true);
      try {
        let results: any[] = [];

        // Check for What3Words format or partial format
        if (query.includes(".")) {
          results = await getWhat3WordsSuggestions(query);
        }
        // Check if input matches UK postcode format
        else if (query.match(/^[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}$/i)) {
          results = await searchPostcode(query);
        }
        // Default to Google Places search
        else {
          results = (await searchGooglePlaces(query)) as any[];
        }

        setSearchResults(results);
        setShowResults(true);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsLoading(false);
      }
    }, 300),
  ).current;

  const handleResultClick = async (result: any) => {
    let location = null;

    if (result.isW3W) {
      // Convert What3Words to coordinates
      location = await convertWhat3WordsToCoordinates(result.words);
      if (location) {
        onLocationSelect(location);
      }
    } else if (result.location) {
      onLocationSelect(result.location);
    } else if (result.place_id) {
      const placesService = new google.maps.places.PlacesService(
        document.createElement("div"),
      );

      placesService.getDetails(
        {
          placeId: result.place_id,
          fields: ["geometry"],
        },
        (place, status) => {
          if (
            status === google.maps.places.PlacesServiceStatus.OK &&
            place?.geometry?.location
          ) {
            onLocationSelect({
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng(),
            });
          }
        },
      );
    }
    setShowResults(false);
    setSearchQuery(result.description);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    debouncedSearch(value);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      debouncedSearch.cancel();
    };
  }, []);

  return (
    <div
      ref={searchContainerRef}
      className="relative w-full max-w-xl mx-auto mb-4"
    >
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="Search address, postcode, or what3words"
          value={searchQuery}
          onChange={handleInputChange}
          className={`${
            colorMode === "dark"
              ? "bg-gray-700 text-yellow-300 border-yellow-300"
              : colorMode === "yellow"
                ? "bg-yellow-50 border-yellow-200"
                : ""
          } ${isDyslexicFont ? "font-dyslexic" : ""}`}
        />
        <Button
          onClick={() => debouncedSearch(searchQuery)}
          disabled={isLoading}
          className={colorMode === "dark" ? "bg-gray-600 text-yellow-300" : ""}
        >
          <SearchIcon className="h-4 w-4" />
        </Button>
      </div>

      {showResults && searchResults.length > 0 && (
        <Card
          className={`absolute z-10 w-full mt-1 max-h-60 overflow-y-auto ${
            colorMode === "dark"
              ? "bg-gray-800 border-yellow-300"
              : colorMode === "yellow"
                ? "bg-yellow-50 border-yellow-200"
                : ""
          }`}
        >
          <div className="p-2">
            {searchResults.map((result, index) => (
              <button
                key={index}
                onClick={() => handleResultClick(result)}
                className={`w-full text-left px-3 py-2 rounded hover:bg-gray-100 flex items-center gap-2 ${
                  colorMode === "dark"
                    ? "text-yellow-300 hover:bg-gray-700"
                    : colorMode === "yellow"
                      ? "hover:bg-yellow-100"
                      : ""
                } ${isDyslexicFont ? "font-dyslexic" : ""}`}
              >
                <MapPinIcon
                  className={`h-4 w-4 ${
                    colorMode === "dark" ? "text-yellow-300" : ""
                  }`}
                />
                <span>{result.description}</span>
              </button>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
