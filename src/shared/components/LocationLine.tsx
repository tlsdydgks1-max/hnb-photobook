import { formatLocation, hasGps } from "../memoryUtils";
import type { Memory } from "../types";

type LocationLineProps = {
  memory: Memory;
  compact?: boolean;
};

export function LocationLine({ memory, compact = false }: LocationLineProps) {
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
