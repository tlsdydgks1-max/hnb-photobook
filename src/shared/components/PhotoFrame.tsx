import { useState } from "react";
import type { Memory } from "../types";

type PhotoFrameProps = {
  memory: Memory;
  className?: string;
};

export function PhotoFrame({ memory, className }: PhotoFrameProps) {
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

