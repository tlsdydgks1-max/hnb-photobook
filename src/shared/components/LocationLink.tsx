import { mapUrl } from "../memoryUtils";
import type { Memory } from "../types";

type LocationLinkProps = {
  memory: Memory;
};

export function LocationLink({ memory }: LocationLinkProps) {
  const href = mapUrl(memory);
  if (!href) return null;

  return (
    <a className="map-link" href={href} target="_blank" rel="noreferrer">
      지도에서 보기
    </a>
  );
}
