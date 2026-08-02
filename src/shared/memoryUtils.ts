import type { Memory } from "./types";

export function formatStep(index: number, total: number) {
  return `${String(index + 1).padStart(2, "0")} / ${String(total).padStart(
    2,
    "0",
  )}`;
}

export function sortByIds(items: Memory[], orderedIds: string[]) {
  const byId = new Map(items.map((item) => [item.id, item]));
  return orderedIds.map((id) => byId.get(id)).filter(Boolean) as Memory[];
}

export function hasGps(memory: Memory) {
  return (
    typeof memory.exif?.latitude === "number" &&
    typeof memory.exif?.longitude === "number"
  );
}

export function formatLocation(memory: Memory) {
  if (!hasGps(memory)) return "위치 정보 없음";
  return `${memory.exif!.latitude!.toFixed(5)} / ${memory.exif!.longitude!.toFixed(5)}`;
}

export function mapUrl(memory: Memory) {
  if (!hasGps(memory)) return undefined;
  return `https://www.google.com/maps?q=${memory.exif!.latitude},${memory.exif!.longitude}`;
}
