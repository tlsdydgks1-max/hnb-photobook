import type { NaverMapsApi } from "./types";

declare global {
  interface Window {
    naver?: {
      maps: NaverMapsApi;
    };
    navermap_authFailure?: () => void;
  }
}

export {};

