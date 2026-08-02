import { useRef, useState } from "react";
import { LocationLine } from "../../shared/components/LocationLine";
import { LocationLink } from "../../shared/components/LocationLink";
import { PhotoFrame } from "../../shared/components/PhotoFrame";
import type { Memory } from "../../shared/types";

type MemoryStoryProps = {
  memory: Memory;
  onNext: () => void;
  onPrev: () => void;
};

export function MemoryStory({ memory, onNext, onPrev }: MemoryStoryProps) {
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

