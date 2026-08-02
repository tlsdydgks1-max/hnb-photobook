export type Memory = {
  id: string;
  image: string;
  date: string;
  place: string;
  title: string;
  message: string;
  exif?: {
    takenAt?: string;
    latitude?: number;
    longitude?: number;
  };
};

export type View = "intro" | "story" | "gallery" | "map" | "proposal";

export type NaverMapsApi = {
  LatLng: new (lat: number, lng: number) => unknown;
  LatLngBounds: new (sw: unknown, ne: unknown) => {
    extend: (latlng: unknown) => void;
  };
  Map: new (
    element: HTMLElement,
    options: {
      center: unknown;
      zoom: number;
      minZoom?: number;
      zoomControl?: boolean;
      scaleControl?: boolean;
      logoControl?: boolean;
      mapDataControl?: boolean;
    },
  ) => NaverMapInstance;
  Marker: new (options: {
    position: unknown;
    map: unknown;
    title?: string;
    icon?: { content: string; size?: unknown; anchor?: unknown };
  }) => unknown;
  Point: new (x: number, y: number) => unknown;
  Size: new (width: number, height: number) => unknown;
  Event: {
    addListener: (
      target: unknown,
      eventName: string,
      listener: () => void,
    ) => void;
  };
};

export type NaverMapInstance = {
  fitBounds: (
    bounds: unknown,
    options?: { top: number; right: number; bottom: number; left: number },
  ) => void;
  setCenter: (latlng: unknown) => void;
  setZoom: (zoom: number) => void;
};

