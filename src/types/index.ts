export interface ApiKeys {
  googleMaps: string;
  what3words: string;
  azureSpeech: string;
  dataLayersApi: string;
}

export interface WidgetConfig {
  apiKeys: ApiKeys;
  dataLayersApiUrl: string;
  defaultLocation?: {
    lat: number;
    lng: number;
  };
  initialColorMode?: "light" | "dark" | "yellow";
  initialActiveLayers?: {
    zebraCrossings?: boolean;
    wheelchairServices?: boolean;
    [key: string]: boolean | undefined;
  };
}
