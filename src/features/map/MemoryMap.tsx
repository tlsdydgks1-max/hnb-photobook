import { useEffect, useMemo, useRef, useState } from "react";
import "../../shared/naverMaps";
import { formatLocation, hasGps } from "../../shared/memoryUtils";
import type { Memory, NaverMapInstance } from "../../shared/types";

type MemoryMapProps = {
  memories: Memory[];
};

export function MemoryMap({ memories }: MemoryMapProps) {
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<NaverMapInstance | null>(null);
  const sheetDragStartYRef = useRef(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isSheetExpanded, setIsSheetExpanded] = useState(false);
  const [loadState, setLoadState] = useState<
    "idle" | "ready" | "missing-key" | "error"
  >("idle");
  const mappedMemories = useMemo(() => memories.filter(hasGps), [memories]);
  const selectedMemory =
    mappedMemories.find((memory) => memory.id === selectedId) ??
    mappedMemories[0];

  const selectMapMemory = (memory: Memory) => {
    setSelectedId(memory.id);
    setIsSheetExpanded(false);

    if (!window.naver?.maps || !memory.exif?.latitude || !memory.exif.longitude) {
      return;
    }

    const position = new window.naver.maps.LatLng(
      memory.exif.latitude,
      memory.exif.longitude,
    );
    mapInstanceRef.current?.setCenter(position);
    mapInstanceRef.current?.setZoom(15);
  };

  useEffect(() => {
    if (mappedMemories.length === 0) return;

    const env = import.meta.env as Record<string, string | undefined>;
    const naverMapKey =
      env.VITE_NAVER_MAP_CLIENT_ID ?? env.VITE_NAVER_MAP_NCP_KEY_ID;

    if (!naverMapKey) {
      setLoadState("missing-key");
      return;
    }

    if (window.naver?.maps) {
      setLoadState("ready");
      return;
    }

    const scriptId = "naver-map-api";
    const existingScript = document.getElementById(scriptId) as
      | HTMLScriptElement
      | null;

    window.navermap_authFailure = () => setLoadState("error");

    if (existingScript) {
      existingScript.addEventListener("load", () => setLoadState("ready"), {
        once: true,
      });
      existingScript.addEventListener("error", () => setLoadState("error"), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${encodeURIComponent(
      naverMapKey,
    )}`;
    script.async = true;
    script.onload = () => setLoadState("ready");
    script.onerror = () => setLoadState("error");
    document.head.appendChild(script);
  }, [mappedMemories.length]);

  useEffect(() => {
    if (loadState !== "ready" || !mapElementRef.current || !window.naver?.maps) {
      return;
    }

    const maps = window.naver.maps;
    const first = mappedMemories[0];
    if (!first?.exif?.latitude || !first.exif.longitude) return;

    const firstLatLng = new maps.LatLng(first.exif.latitude, first.exif.longitude);
    const map = new maps.Map(mapElementRef.current, {
      center: firstLatLng,
      zoom: 12,
      minZoom: 8,
      zoomControl: false,
      scaleControl: false,
      logoControl: true,
      mapDataControl: false,
    });
    mapInstanceRef.current = map;
    const bounds = new maps.LatLngBounds(firstLatLng, firstLatLng);

    mappedMemories.forEach((memory) => {
      const latitude = memory.exif!.latitude!;
      const longitude = memory.exif!.longitude!;
      const position = new maps.LatLng(latitude, longitude);
      bounds.extend(position);

      const marker = new maps.Marker({
        position,
        map,
        title: memory.place,
        icon: {
          content: `<button class="memory-map-marker" aria-label="${memory.place}"><img src="${memory.image}" alt="" /></button>`,
          size: new maps.Size(52, 52),
          anchor: new maps.Point(26, 52),
        },
      });

      maps.Event.addListener(marker, "click", () => {
        selectMapMemory(memory);
      });
    });

    if (mappedMemories.length > 1) {
      map.fitBounds(bounds, { top: 80, right: 42, bottom: 220, left: 42 });
    }
  }, [loadState, mappedMemories]);

  return (
    <section className="screen map-screen">
      <div className="map-panel">
        <div ref={mapElementRef} className="naver-map" aria-label="데이트 위치 지도" />
        {loadState !== "ready" && (
          <div className="map-fallback">
            <strong>
              {loadState === "missing-key"
                ? "네이버 지도 API 키가 필요해요"
                : "지도를 불러오는 중이에요"}
            </strong>
            <span>
              {loadState === "missing-key"
                ? "VITE_NAVER_MAP_CLIENT_ID 또는 VITE_NAVER_MAP_NCP_KEY_ID를 설정하면 실제 네이버 지도가 표시됩니다."
                : "잠시만 기다려 주세요."}
            </span>
          </div>
        )}
      </div>

      <aside
        className={
          isSheetExpanded
            ? "map-bottom-sheet glass-panel expanded"
            : "map-bottom-sheet glass-panel"
        }
        aria-label="지도 사진 메뉴"
      >
        <div
          className="bottom-sheet-handle"
          onPointerDown={(event) => {
            sheetDragStartYRef.current = event.clientY;
            event.currentTarget.setPointerCapture(event.pointerId);
          }}
          onPointerUp={(event) => {
            const diff = sheetDragStartYRef.current - event.clientY;
            if (diff > 24) setIsSheetExpanded(true);
            if (diff < -24) setIsSheetExpanded(false);
            sheetDragStartYRef.current = 0;
            event.currentTarget.releasePointerCapture(event.pointerId);
          }}
          onPointerCancel={() => {
            sheetDragStartYRef.current = 0;
          }}
          role="presentation"
        >
          <span />
        </div>

        {selectedMemory && (
          <button
            className="selected-map-memory"
            onClick={() => selectMapMemory(selectedMemory)}
          >
            <img src={selectedMemory.image} alt="" />
            <div>
              <strong>{selectedMemory.place}</strong>
              <small>{selectedMemory.date}</small>
            </div>
          </button>
        )}

        <div className="map-place-list">
          {mappedMemories.map((memory) => (
            <button
              className={
                selectedMemory?.id === memory.id
                  ? "map-place-card active"
                  : "map-place-card"
              }
              key={memory.id}
              onClick={() => selectMapMemory(memory)}
            >
              <img src={memory.image} alt="" />
              <div>
                <strong>{memory.place}</strong>
                <small>{memory.date}</small>
                <em>{formatLocation(memory)}</em>
              </div>
            </button>
          ))}
        </div>
      </aside>
    </section>
  );
}
