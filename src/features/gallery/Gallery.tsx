import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import FavoriteBorderRoundedIcon from "@mui/icons-material/FavoriteBorderRounded";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import KeyboardArrowUpRoundedIcon from "@mui/icons-material/KeyboardArrowUpRounded";
import { CircleIcon } from "../../components/CircleIcon";
import { LocationLine } from "../../shared/components/LocationLine";
import { LocationLink } from "../../shared/components/LocationLink";
import { PhotoFrame } from "../../shared/components/PhotoFrame";
import { formatStep } from "../../shared/memoryUtils";
import type { Memory } from "../../shared/types";

type GalleryProps = {
  memories: Memory[];
  selected: Memory | null;
  favoriteIds: string[];
  storyMemories: Memory[];
  onSelect: (memory: Memory) => void;
  onCloseDetail: () => void;
  onOpenStory: (memoryId: string) => void;
  onToggleFavorite: (memoryId: string) => void;
  onMoveFavorite: (memoryId: string, direction: -1 | 1) => void;
};

export function Gallery({
  memories,
  selected,
  favoriteIds,
  storyMemories,
  onSelect,
  onCloseDetail,
  onOpenStory,
  onToggleFavorite,
  onMoveFavorite,
}: GalleryProps) {
  const selectedIndex = selected ? favoriteIds.indexOf(selected.id) : -1;

  return (
    <section className="screen gallery-screen">
      <header className="section-header">
        <p className="eyebrow">Gallery</p>
        <h1>하트한 사진의 스토리를 골라요</h1>
      </header>

      <details className="favorites-strip">
        <summary className="strip-heading" aria-label="선택한 스토리 순서 펼치기">
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
