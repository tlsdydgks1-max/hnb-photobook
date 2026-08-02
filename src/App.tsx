import { useCallback, useEffect, useMemo, useState } from "react";
import { Gallery } from "./features/gallery/Gallery";
import { CoverIntro } from "./features/intro/CoverIntro";
import { MemoryMap } from "./features/map/MemoryMap";
import { defaultFavoriteIds, memories } from "./features/memories/memoryData";
import { ProposalFinal } from "./features/proposal/ProposalFinal";
import { MemoryStory } from "./features/story/MemoryStory";
import { AppNavigation } from "./shared/components/AppNavigation";
import { sortByIds } from "./shared/memoryUtils";
import type { Memory, View } from "./shared/types";

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
        <AppNavigation
          isOpen={isMenuOpen}
          onToggle={() => setIsMenuOpen((open) => !open)}
          onNavigate={navigateTo}
        />

        {view === "intro" && (
          <CoverIntro
            storyCount={storyMemories.length}
            coverMemories={memories}
            onStart={() => openStory(0)}
          />
        )}

        {view === "story" && current && (
          <MemoryStory memory={current} onNext={goNext} onPrev={goPrev} />
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
