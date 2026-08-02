import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import KeyboardArrowLeftRoundedIcon from "@mui/icons-material/KeyboardArrowLeftRounded";
import MapRoundedIcon from "@mui/icons-material/MapRounded";
import PhotoLibraryRoundedIcon from "@mui/icons-material/PhotoLibraryRounded";
import { CircleIcon } from "../../components/CircleIcon";
import type { View } from "../types";

type AppNavigationProps = {
  isOpen: boolean;
  onToggle: () => void;
  onNavigate: (view: View) => void;
};

export function AppNavigation({
  isOpen,
  onToggle,
  onNavigate,
}: AppNavigationProps) {
  return (
    <nav
      className={isOpen ? "top-actions open" : "top-actions"}
      aria-label="화면 이동"
    >
      <div className="menu-items">
        <button
          className="ghost-button"
          onClick={() => onNavigate("intro")}
          aria-label="홈으로 이동"
        >
          <CircleIcon Icon={HomeRoundedIcon} className="nav-icon" />
        </button>
        <button
          className="ghost-button"
          onClick={() => onNavigate("gallery")}
          aria-label="갤러리로 이동"
        >
          <CircleIcon Icon={PhotoLibraryRoundedIcon} className="nav-icon" />
        </button>
        <button
          className="ghost-button"
          onClick={() => onNavigate("map")}
          aria-label="지도 보기"
        >
          <CircleIcon Icon={MapRoundedIcon} className="nav-icon" />
        </button>
      </div>
      <button
        className="menu-toggle"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-label={isOpen ? "메뉴 닫기" : "메뉴 열기"}
      >
        <CircleIcon
          Icon={isOpen ? CloseRoundedIcon : KeyboardArrowLeftRoundedIcon}
          className="nav-icon"
        />
      </button>
    </nav>
  );
}
