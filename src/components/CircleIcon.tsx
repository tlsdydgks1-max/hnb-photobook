import type { ComponentType } from "react";
import type { SvgIconProps } from "@mui/material/SvgIcon";

type CircleIconProps = {
  Icon: ComponentType<SvgIconProps>;
  className?: string;
  label?: string;
};

export function CircleIcon({ Icon, className, label }: CircleIconProps) {
  return (
    <span className={`circle-icon ${className ?? ""}`} aria-hidden={!label}>
      <Icon className="circle-icon-svg" aria-label={label} focusable="false" />
    </span>
  );
}
