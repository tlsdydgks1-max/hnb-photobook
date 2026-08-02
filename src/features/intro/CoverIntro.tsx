import { useRef, useState } from "react";
import KeyboardArrowLeftRoundedIcon from "@mui/icons-material/KeyboardArrowLeftRounded";
import { CircleIcon } from "../../components/CircleIcon";
import { PhotoFrame } from "../../shared/components/PhotoFrame";
import type { Memory } from "../../shared/types";

type CoverIntroProps = {
  storyCount: number;
  coverMemories: Memory[];
  onStart: () => void;
};

export function CoverIntro({
  storyCount,
  coverMemories,
  onStart,
}: CoverIntroProps) {
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
            우리 추억을 왼쪽으로 넘겨주세요
          </span>
        </div>
        <div className="cover-stack" aria-hidden="true">
          {coverMemories.slice(0, 3).map((memory, index) => (
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
