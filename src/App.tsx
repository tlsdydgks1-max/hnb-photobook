import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import FavoriteBorderRoundedIcon from "@mui/icons-material/FavoriteBorderRounded";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import KeyboardArrowLeftRoundedIcon from "@mui/icons-material/KeyboardArrowLeftRounded";
import KeyboardArrowUpRoundedIcon from "@mui/icons-material/KeyboardArrowUpRounded";
import MapRoundedIcon from "@mui/icons-material/MapRounded";
import PhotoLibraryRoundedIcon from "@mui/icons-material/PhotoLibraryRounded";
import photoMetadata from "./photo-metadata.json";
import { CircleIcon } from "./components/CircleIcon";

type Memory = {
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

type View = "intro" | "story" | "gallery" | "map" | "proposal";

type NaverMapsApi = {
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
  ) => {
    fitBounds: (bounds: unknown, options?: { top: number; right: number; bottom: number; left: number }) => void;
    setCenter: (latlng: unknown) => void;
    setZoom: (zoom: number) => void;
  };
  Marker: new (options: {
    position: unknown;
    map: unknown;
    title?: string;
    icon?: { content: string; size?: unknown; anchor?: unknown };
  }) => unknown;
  Point: new (x: number, y: number) => unknown;
  Size: new (width: number, height: number) => unknown;
  Event: {
    addListener: (target: unknown, eventName: string, listener: () => void) => void;
  };
};

declare global {
  interface Window {
    naver?: {
      maps: NaverMapsApi;
    };
    navermap_authFailure?: () => void;
  }
}

const photoMetadataById = new Map(
  photoMetadata.map((item) => [item.id, item.exif]),
);

const messages = [
  "이 사진을 고른 순간부터 우리의 이야기가 다시 천천히 시작돼.",
  "평범한 하루도 너와 있으면 오래 꺼내 보고 싶은 장면이 됐어.",
  "어디로 가는지보다 누구와 걷는지가 더 중요하다는 걸 배웠어.",
  "봄빛 아래에서 웃던 너를 보면 아직도 마음이 환해져.",
  "처음 가는 곳도 너와 함께면 금방 우리 장소가 되더라.",
  "뜨겁고 반짝이던 그날처럼, 우리도 오래 빛났으면 해.",
  "사진에는 다 담기지 않았지만 그때의 웃음은 아직 생생해.",
  "말이 많지 않아도 충분했던 밤, 네 옆이라서 편안했어.",
  "찬 바람이 불어도 손을 잡고 있으면 괜찮다고 느꼈어.",
  "올해도, 다음 해도, 같은 마음으로 너를 만나고 싶어.",
  "우리만 아는 순간들이 쌓여서 가장 큰 이야기가 됐어.",
  "같은 풍경을 보고 같은 생각을 떠올리는 일이 참 좋았어.",
  "하루 끝에 가장 먼저 떠오르는 사람이 너라서 고마워.",
  "계절이 차가워져도 우리 사이에는 늘 따뜻한 자리가 있었어.",
  "지금까지의 모든 장면이 오늘 이 마음을 위해 이어진 것 같아.",
];

const memories: Memory[] = [
  ["img1", "2023.10.15", "첫 번째 장면", "처음처럼 선명한 날"],
  ["img2", "2023.12.24", "따뜻했던 계절", "오래 보고 싶은 표정"],
  ["img3", "2024.02.11", "함께 걷던 길", "발걸음이 맞던 순간"],
  ["img4", "2024.04.06", "봄날의 기억", "계절이 우리 편이던 날"],
  ["img5", "2024.05.19", "작은 여행", "낯선 곳의 익숙함"],
  ["img6", "2024.07.07", "여름의 한가운데", "빛이 많던 오후"],
  ["img7", "2024.08.18", "웃음이 남은 곳", "사진 밖의 웃음소리"],
  ["img8", "2024.09.21", "우리의 밤", "조용해서 더 좋았던 시간"],
  ["img9", "2024.11.03", "가을 끝자락", "느리게 머문 계절"],
  ["img10", "2025.01.12", "새해의 약속", "다시 시작하는 마음"],
  ["img11", "2025.03.16", "둘만의 기록", "아무도 모르는 작은 장면"],
  ["img12", "2025.05.18", "푸른 날", "마음이 닮아가던 때"],
  ["img13", "2025.08.09", "긴 하루의 끝", "돌아갈 곳 같은 사람"],
  ["img14", "2025.11.22", "겨울 앞에서", "따뜻함을 나누던 날"],
  ["img15", "2026.07.25", "오늘, 우리", "다음 이야기를 시작하는 날"],
].map(([id, date, place, title], index) => ({
  id,
  image: `/photos/${id}.jpg`,
  date,
  place,
  title,
  message: messages[index],
  exif: photoMetadataById.get(id),
}));

const defaultFavoriteIds = memories.slice(0, 6).map((memory) => memory.id);

function formatStep(index: number, total: number) {
  return `${String(index + 1).padStart(2, "0")} / ${String(total).padStart(
    2,
    "0",
  )}`;
}

function sortByIds(items: Memory[], orderedIds: string[]) {
  const byId = new Map(items.map((item) => [item.id, item]));
  return orderedIds.map((id) => byId.get(id)).filter(Boolean) as Memory[];
}

function hasGps(memory: Memory) {
  return (
    typeof memory.exif?.latitude === "number" &&
    typeof memory.exif?.longitude === "number"
  );
}

function formatLocation(memory: Memory) {
  if (!hasGps(memory)) return "위치 정보 없음";
  return `${memory.exif!.latitude!.toFixed(5)} / ${memory.exif!.longitude!.toFixed(5)}`;
}

function mapUrl(memory: Memory) {
  if (!hasGps(memory)) return undefined;
  return `https://www.google.com/maps?q=${memory.exif!.latitude},${memory.exif!.longitude}`;
}

export default function App() {
  const [view, setView] = useState<View>("intro");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<string[]>(defaultFavoriteIds);

  useEffect(() => {
    const saved = window.localStorage.getItem("hb-photobook-favorites");
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved) as string[];
      const validIds = parsed.filter((id) =>
        memories.some((memory) => memory.id === id),
      );
      if (validIds.length > 0) {
        window.queueMicrotask(() => setFavoriteIds(validIds));
      }
    } catch {
      window.localStorage.removeItem("hb-photobook-favorites");
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      "hb-photobook-favorites",
      JSON.stringify(favoriteIds),
    );
  }, [favoriteIds]);

  const storyMemories = useMemo(
    () => sortByIds(memories, favoriteIds),
    [favoriteIds],
  );
  const current = storyMemories[activeIndex] ?? storyMemories[0];

  const navigateTo = (nextView: View) => {
    setView(nextView);
    setIsMenuOpen(false);
  };

  const openStory = (index = 0) => {
    if (storyMemories.length === 0) {
      setView("gallery");
      return;
    }
    setActiveIndex(Math.min(index, storyMemories.length - 1));
    setView("story");
  };

  const goNext = useCallback(() => {
    setActiveIndex((index) => {
      if (index >= storyMemories.length - 1) {
        setView("proposal");
        return index;
      }
      return index + 1;
    });
  }, [storyMemories.length]);

  const goPrev = useCallback(() => {
    setActiveIndex((index) => Math.max(0, index - 1));
  }, []);

  const toggleFavorite = (memoryId: string) => {
    setFavoriteIds((ids) =>
      ids.includes(memoryId)
        ? ids.filter((id) => id !== memoryId)
        : [...ids, memoryId],
    );
  };

  const moveFavorite = (memoryId: string, direction: -1 | 1) => {
    setFavoriteIds((ids) => {
      const from = ids.indexOf(memoryId);
      const to = from + direction;
      if (from < 0 || to < 0 || to >= ids.length) return ids;

      const next = [...ids];
      [next[from], next[to]] = [next[to], next[from]];
      return next;
    });
  };

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (view !== "story") return;
      if (event.key === "ArrowRight") goNext();
      if (event.key === "ArrowLeft") goPrev();
      if (event.key === "Escape") setView("intro");
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [goNext, goPrev, view]);

  return (
    <main className="app-shell">
      <div className="aurora aurora-one" />
      <div className="aurora aurora-two" />
      <div className="phone-stage">
        <nav
          className={isMenuOpen ? "top-actions open" : "top-actions"}
          aria-label="화면 이동"
        >
          <div className="menu-items">
            <button
              className="ghost-button"
              onClick={() => navigateTo("intro")}
              aria-label="홈으로 이동"
            >
              <CircleIcon Icon={HomeRoundedIcon} className="nav-icon" />
            </button>
            <button
              className="ghost-button"
              onClick={() => navigateTo("gallery")}
              aria-label="갤러리로 이동"
            >
              <CircleIcon Icon={PhotoLibraryRoundedIcon} className="nav-icon" />
            </button>
            <button
              className="ghost-button"
              onClick={() => navigateTo("map")}
              aria-label="지도 보기"
            >
              <CircleIcon Icon={MapRoundedIcon} className="nav-icon" />
            </button>
          </div>
          <button
            className="menu-toggle"
            onClick={() => setIsMenuOpen((open) => !open)}
            aria-expanded={isMenuOpen}
            aria-label={isMenuOpen ? "메뉴 닫기" : "메뉴 열기"}
          >
            <CircleIcon
              Icon={isMenuOpen ? CloseRoundedIcon : KeyboardArrowLeftRoundedIcon}
              className="nav-icon"
            />
          </button>
        </nav>

        {view === "intro" && (
          <CoverIntro
            storyCount={storyMemories.length}
            onStart={() => openStory(0)}
          />
        )}

        {view === "story" && current && (
          <MemoryStory
            memory={current}
            onNext={goNext}
            onPrev={goPrev}
          />
        )}

        {view === "gallery" && (
          <Gallery
            memories={memories}
            selected={selectedMemory}
            favoriteIds={favoriteIds}
            storyMemories={storyMemories}
            onSelect={setSelectedMemory}
            onCloseDetail={() => setSelectedMemory(null)}
            onOpenStory={(memoryId) => {
              const index = favoriteIds.indexOf(memoryId);
              setSelectedMemory(null);
              openStory(Math.max(0, index));
            }}
            onToggleFavorite={toggleFavorite}
            onMoveFavorite={moveFavorite}
          />
        )}

        {view === "map" && <MemoryMap memories={memories} />}

        {view === "proposal" && (
          <ProposalFinal
            onReplay={() => openStory(0)}
            onGallery={() => setView("gallery")}
          />
        )}
      </div>
    </main>
  );
}

function CoverIntro({
  storyCount,
  onStart,
}: {
  storyCount: number;
  onStart: () => void;
}) {
  const [dragX, setDragX] = useState(0);
  const startX = useRef(0);
  const dragXRef = useRef(0);
  const isDraggingRef = useRef(false);
  const canStart = storyCount > 0;

  const endDrag = () => {
    isDraggingRef.current = false;
    if (canStart && dragXRef.current < -90) {
      onStart();
    }
    dragXRef.current = 0;
    setDragX(0);
  };

  return (
    <section className="screen intro-screen">
      <div
        className="intro-card glass-panel"
        onPointerDown={(event) => {
          startX.current = event.clientX;
          dragXRef.current = 0;
          isDraggingRef.current = true;
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (!isDraggingRef.current) return;
          const nextDragX = Math.min(24, event.clientX - startX.current);
          dragXRef.current = nextDragX;
          setDragX(nextDragX);
        }}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onTouchStart={(event) => {
          startX.current = event.touches[0]?.clientX ?? 0;
          dragXRef.current = 0;
          isDraggingRef.current = true;
        }}
        onTouchMove={(event) => {
          if (!isDraggingRef.current) return;
          const nextDragX = Math.min(
            24,
            (event.touches[0]?.clientX ?? startX.current) - startX.current,
          );
          dragXRef.current = nextDragX;
          setDragX(nextDragX);
        }}
        onTouchEnd={endDrag}
        style={{
          transform: `translateX(${dragX}px) rotate(${dragX / 26}deg)`,
          transition: isDraggingRef.current ? "none" : "transform 420ms ease",
        }}
      >
        <p className="eyebrow">Our Memory Book</p>
        <h1>하트로 고른 우리 이야기</h1>
        <p className="intro-copy">
          갤러리에서 하트한 사진들이 원하는 순서대로 스토리 화면에 펼쳐져요.
        </p>
        <div className="swipe-start-hint" aria-hidden="true">
          <span>
            <CircleIcon
              Icon={KeyboardArrowLeftRoundedIcon}
              className="swipe-start-handle"
            />
            우리의 추억을 왼쪽으로 넘겨주세요
          </span>
        </div>
        <div className="cover-stack" aria-hidden="true">
          {memories.slice(0, 3).map((memory, index) => (
            <PhotoFrame
              key={memory.id}
              memory={memory}
              className={`cover-photo cover-photo-${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function MemoryStory({
  memory,
  onNext,
  onPrev,
}: {
  memory: Memory;
  onNext: () => void;
  onPrev: () => void;
}) {
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const rotate = dragX / 18;
  const opacity = Math.min(Math.abs(dragX) / 120, 1);

  const endDrag = () => {
    setIsDragging(false);
    if (dragX > 90) onPrev();
    if (dragX < -90) onNext();
    setDragX(0);
  };

  return (
    <section className="screen swipe-screen">
      <header className="memory-header">
        <div>
          <p>{memory.date}</p>
          <h2>{memory.place}</h2>
          <LocationLine memory={memory} />
        </div>
      </header>

      <div className="card-zone">
        <div
          className="memory-card-shell"
          onPointerDown={(event) => {
            startX.current = event.clientX;
            setIsDragging(true);
            event.currentTarget.setPointerCapture(event.pointerId);
          }}
          onPointerMove={(event) => {
            if (!isDragging) return;
            setDragX(event.clientX - startX.current);
          }}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          style={{
            transform: `translateX(${dragX}px) rotate(${rotate}deg)`,
            transition: isDragging ? "none" : "transform 500ms ease",
          }}
        >
          <span className="reaction yes" style={{ opacity }}>
            NEXT
          </span>
          <span className="reaction no" style={{ opacity }}>
            BACK
          </span>
          <PhotoFrame memory={memory} className="memory-photo" />
        </div>
      </div>

      <footer className="message-panel glass-panel">
        <p className="message-title">{memory.title}</p>
        <p className="message-copy">{memory.message}</p>
        <LocationLink memory={memory} />
      </footer>
    </section>
  );
}

function Gallery({
  memories,
  selected,
  favoriteIds,
  storyMemories,
  onSelect,
  onCloseDetail,
  onOpenStory,
  onToggleFavorite,
  onMoveFavorite,
}: {
  memories: Memory[];
  selected: Memory | null;
  favoriteIds: string[];
  storyMemories: Memory[];
  onSelect: (memory: Memory) => void;
  onCloseDetail: () => void;
  onOpenStory: (memoryId: string) => void;
  onToggleFavorite: (memoryId: string) => void;
  onMoveFavorite: (memoryId: string, direction: -1 | 1) => void;
}) {
  const selectedIndex = selected ? favoriteIds.indexOf(selected.id) : -1;

  return (
    <section className="screen gallery-screen">
      <header className="section-header">
        <p className="eyebrow">Gallery</p>
        <h1>하트한 사진이 스토리가 돼요</h1>
      </header>

      <details className="favorites-strip">
        <summary
          className="strip-heading"
          aria-label="선택한 스토리 순서 펼치기"
        >
          <strong>스토리 순서</strong>
          <span>{storyMemories.length}장</span>
          <span className="strip-toggle when-closed">펼치기</span>
          <span className="strip-toggle when-open">접기</span>
        </summary>
        {storyMemories.length > 0 ? (
          <div className="favorite-list">
            {storyMemories.map((memory, index) => (
              <article className="favorite-row" key={memory.id}>
                <img src={memory.image} alt="" />
                <div>
                  <strong>{memory.place}</strong>
                  <span>{formatStep(index, storyMemories.length)}</span>
                </div>
                <button
                  aria-label={`${memory.place} 앞으로 이동`}
                  onClick={() => onMoveFavorite(memory.id, -1)}
                  disabled={index === 0}
                >
                  <CircleIcon
                    Icon={KeyboardArrowUpRoundedIcon}
                    className="mini-icon"
                  />
                </button>
                <button
                  aria-label={`${memory.place} 뒤로 이동`}
                  onClick={() => onMoveFavorite(memory.id, 1)}
                  disabled={index === storyMemories.length - 1}
                >
                  <CircleIcon
                    Icon={KeyboardArrowDownRoundedIcon}
                    className="mini-icon"
                  />
                </button>
              </article>
            ))}
          </div>
        ) : (
          <p className="empty-note">
            하트를 누르면 여기에 스토리 순서가 생겨요.
          </p>
        )}
      </details>

      <div className="gallery-grid">
        {memories.map((memory) => {
          const isFavorite = favoriteIds.includes(memory.id);

          return (
            <article className="gallery-item glass-panel" key={memory.id}>
              <button
                className="photo-button"
                onClick={() => onSelect(memory)}
                aria-label={`${memory.place} 크게 보기`}
              >
                <PhotoFrame memory={memory} className="gallery-photo" />
              </button>
              <button
                className={isFavorite ? "heart-button active" : "heart-button"}
                onClick={() => onToggleFavorite(memory.id)}
                aria-label={
                  isFavorite ? "스토리에서 빼기" : "스토리에 추가하기"
                }
              >
                <CircleIcon
                  Icon={
                    isFavorite ? FavoriteRoundedIcon : FavoriteBorderRoundedIcon
                  }
                  className="heart-icon"
                />
              </button>
              <span>{memory.date}</span>
              <strong>{memory.place}</strong>
              <LocationLine memory={memory} compact />
            </article>
          );
        })}
      </div>

      {selected && (
        <div className="detail-backdrop" role="dialog" aria-modal="true">
          <article className="detail-card glass-panel">
            <button className="close-button" onClick={onCloseDetail}>
              <CircleIcon Icon={CloseRoundedIcon} className="close-icon" />
            </button>
            <button
              className={
                selectedIndex >= 0
                  ? "heart-button detail-heart active"
                  : "heart-button detail-heart"
              }
              onClick={() => onToggleFavorite(selected.id)}
              aria-label={
                selectedIndex >= 0 ? "스토리에서 빼기" : "스토리에 추가하기"
              }
            >
              <CircleIcon
                Icon={
                  selectedIndex >= 0
                    ? FavoriteRoundedIcon
                    : FavoriteBorderRoundedIcon
                }
                className="heart-icon"
              />
            </button>
            <PhotoFrame memory={selected} className="detail-photo" />
            <p className="eyebrow">{selected.date}</p>
            <h2>{selected.place}</h2>
            <LocationLine memory={selected} />
            <p>{selected.message}</p>
            <LocationLink memory={selected} />
            <button
              className="primary-button"
              onClick={() => onOpenStory(selected.id)}
              disabled={selectedIndex < 0}
            >
              스토리에서 보기
            </button>
          </article>
        </div>
      )}
    </section>
  );
}

function LocationLine({
  memory,
  compact = false,
}: {
  memory: Memory;
  compact?: boolean;
}) {
  return (
    <span
      className={
        hasGps(memory)
          ? compact
            ? "location-line compact"
            : "location-line"
          : compact
            ? "location-line compact muted"
            : "location-line muted"
      }
    >
      {hasGps(memory) ? "촬영 위치 " : ""}
      {formatLocation(memory)}
    </span>
  );
}

function LocationLink({ memory }: { memory: Memory }) {
  const href = mapUrl(memory);
  if (!href) return null;

  return (
    <a className="map-link" href={href} target="_blank" rel="noreferrer">
      지도에서 보기
    </a>
  );
}

function MemoryMap({ memories }: { memories: Memory[] }) {
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loadState, setLoadState] = useState<"idle" | "ready" | "missing-key" | "error">(
    "idle",
  );
  const mappedMemories = useMemo(() => memories.filter(hasGps), [memories]);
  const selectedMemory =
    mappedMemories.find((memory) => memory.id === selectedId) ??
    mappedMemories[0];

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
      zoomControl: true,
      scaleControl: false,
      logoControl: true,
      mapDataControl: false,
    });
    const bounds = new maps.LatLngBounds(firstLatLng, firstLatLng);

    mappedMemories.forEach((memory, index) => {
      const latitude = memory.exif!.latitude!;
      const longitude = memory.exif!.longitude!;
      const position = new maps.LatLng(latitude, longitude);
      bounds.extend(position);

      const marker = new maps.Marker({
        position,
        map,
        title: memory.place,
        icon: {
          content: `<button class="memory-map-marker" aria-label="${memory.place}">${index + 1}</button>`,
          size: new maps.Size(34, 34),
          anchor: new maps.Point(17, 34),
        },
      });

      maps.Event.addListener(marker, "click", () => {
        setSelectedId(memory.id);
        map.setCenter(position);
        map.setZoom(15);
      });
    });

    if (mappedMemories.length > 1) {
      map.fitBounds(bounds, { top: 52, right: 42, bottom: 180, left: 42 });
    }
  }, [loadState, mappedMemories]);

  return (
    <section className="screen map-screen">
      <header className="section-header map-header">
        <p className="eyebrow">Date Map</p>
        <h1>우리가 함께한 위치</h1>
        <p>사진에 남아 있는 위치 정보로 데이트 장소를 지도 위에 모았어요.</p>
      </header>

      <div className="map-panel glass-panel">
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

      <div className="map-place-list">
        {mappedMemories.map((memory, index) => (
          <button
            className={
              selectedMemory?.id === memory.id
                ? "map-place-card glass-panel active"
                : "map-place-card glass-panel"
            }
            key={memory.id}
            onClick={() => setSelectedId(memory.id)}
          >
            <span>{index + 1}</span>
            <img src={memory.image} alt="" />
            <div>
              <strong>{memory.place}</strong>
              <small>{memory.date}</small>
              <em>{formatLocation(memory)}</em>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

function ProposalFinal({
  onReplay,
  onGallery,
}: {
  onReplay: () => void;
  onGallery: () => void;
}) {
  return (
    <section className="screen proposal-screen">
      <div className="proposal-card glass-panel">
        <p className="eyebrow">The Next Chapter</p>
        <h1>우리가 고른 장면 다음에도 함께할래?</h1>
        <p>
          하트로 남긴 사진들처럼, 앞으로의 시간도 우리가 직접 고르고 아끼는
          이야기로 채워가고 싶어.
        </p>
        <div className="proposal-ring" aria-hidden="true">
          <span />
        </div>
      </div>
      <div className="intro-actions">
        <button className="primary-button" onClick={onGallery}>
          사진 다시 고르기
        </button>
        <button className="secondary-button" onClick={onReplay}>
          스토리 다시 보기
        </button>
      </div>
    </section>
  );
}

function PhotoFrame({
  memory,
  className,
}: {
  memory: Memory;
  className?: string;
}) {
  const [hasError, setHasError] = useState(false);
  const photoClass = `photo-frame ${className ?? ""}`;

  if (hasError) {
    return (
      <div className={photoClass}>
        <div className={`photo-fallback fallback-${memory.id}`}>
          <span>{memory.place}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={photoClass}>
      <img
        src={memory.image}
        alt={`${memory.date} ${memory.place}`}
        onError={() => setHasError(true)}
      />
    </div>
  );
}
