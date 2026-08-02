import { useEffect, useMemo, useRef, useState } from "react";
import "../../shared/naverMaps";
import { formatLocation, hasGps } from "../../shared/memoryUtils";
import type { Memory, NaverMapInstance } from "../../shared/types";

type MemoryMapProps = {
  memories: Memory[];
};

type MapMemoryGroup = {
  key: string;
  latitude: number;
  longitude: number;
  memories: Memory[];
};

function coordKey(memory: Memory) {
  return `${memory.exif!.latitude!.toFixed(6)},${memory.exif!.longitude!.toFixed(6)}`;
}

function escapeAttribute(value: string) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

export function MemoryMap({ memories }: MemoryMapProps) {
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<NaverMapInstance | null>(null);
  const sheetRef = useRef<HTMLElement | null>(null);
  const sheetDragStartYRef = useRef(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [sheetHeight, setSheetHeight] = useState(0);
  const [isSheetExpanded, setIsSheetExpanded] = useState(false);
  const [loadState, setLoadState] = useState<
    "idle" | "ready" | "missing-key" | "error"
  >("idle");
  const mappedMemories = useMemo(() => memories.filter(hasGps), [memories]);
  const memoryGroups = useMemo(() => {
    const groups = new Map<string, MapMemoryGroup>();

    mappedMemories.forEach((memory) => {
      const key = coordKey(memory);
      const group = groups.get(key);

      if (group) {
        group.memories.push(memory);
        return;
      }

      groups.set(key, {
        key,
        latitude: memory.exif!.latitude!,
        longitude: memory.exif!.longitude!,
        memories: [memory],
      });
    });

    return [...groups.values()];
  }, [mappedMemories]);
  const selectedMemory =
    mappedMemories.find((memory) => memory.id === selectedId) ??
    mappedMemories[0];
  const detailMemory = mappedMemories.find((memory) => memory.id === detailId);
  const detailGroup = detailMemory
    ? memoryGroups.find((group) => group.key === coordKey(detailMemory))
    : undefined;

  const selectMapMemory = (memory: Memory, showDetails = false) => {
    setSelectedId(memory.id);
    if (showDetails) {
      setDetailId(memory.id);
      setIsSheetExpanded(false);
    } else if (detailId) {
      setDetailId(memory.id);
    }

    if (!window.naver?.maps || !memory.exif?.latitude || !memory.exif.longitude) {
      return;
    }

    const position = new window.naver.maps.LatLng(
      memory.exif.latitude,
      memory.exif.longitude,
    );
    mapInstanceRef.current?.setCenter(position);
  };

  useEffect(() => {
    if (!sheetRef.current) return;

    const updateSheetHeight = () => {
      setSheetHeight(sheetRef.current?.offsetHeight ?? 0);
    };
    updateSheetHeight();

    const resizeObserver = new ResizeObserver(updateSheetHeight);
    resizeObserver.observe(sheetRef.current);

    return () => resizeObserver.disconnect();
  }, []);

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

    memoryGroups.forEach((group) => {
      const position = new maps.LatLng(group.latitude, group.longitude);
      bounds.extend(position);
      const memory = group.memories[0];
      const count = group.memories.length;

      const marker = new maps.Marker({
        position,
        map,
        title: memory.place,
        icon: {
          content: `<button class="memory-map-marker" aria-label="${escapeAttribute(memory.place)}"><img src="${memory.image}" alt="" />${count > 1 ? `<span>${count}</span>` : ""}</button>`,
          size: new maps.Size(52, 52),
          anchor: new maps.Point(26, 52),
        },
      });

      maps.Event.addListener(marker, "click", () => {
        selectMapMemory(memory, true);
      });
    });

    if (memoryGroups.length > 1) {
      map.fitBounds(bounds, { top: 80, right: 42, bottom: 220, left: 42 });
    }
  }, [loadState, mappedMemories, memoryGroups]);

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

      {detailMemory && (
        <article
          className={
            isSheetExpanded
              ? "map-detail-card glass-panel above-expanded-sheet"
              : "map-detail-card glass-panel"
          }
          style={
            isSheetExpanded ? { bottom: `calc(${sheetHeight}px + 12px)` } : undefined
          }
        >
          <button
            className="map-detail-close"
            type="button"
            onClick={() => setDetailId(null)}
          >
            닫기
          </button>
          <img src={detailMemory.image} alt="" />
          <div>
            <small>{detailMemory.date}</small>
            <strong>{detailMemory.title}</strong>
            <p>{detailMemory.message}</p>
            {detailGroup && detailGroup.memories.length > 1 && (
              <div className="map-detail-siblings">
                {detailGroup.memories.map((memory) => (
                  <button
                    className={memory.id === detailMemory.id ? "active" : ""}
                    key={memory.id}
                    type="button"
                    onClick={() => setDetailId(memory.id)}
                  >
                    <img src={memory.image} alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </article>
      )}

      <aside
        ref={sheetRef}
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
            onClick={() => selectMapMemory(selectedMemory, true)}
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
