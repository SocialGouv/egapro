"use client";

import { type ReactNode, useState } from "react";

export interface HoverTogglerProps {
  hover: ReactNode;
  normal: ReactNode;
}

export const HoverToggler = ({ normal, hover }: HoverTogglerProps) => {
  const [isHover, setIsHover] = useState(false);

  return (
    <div onMouseEnter={() => setIsHover(true)} onMouseLeave={() => setIsHover(false)}>
      {isHover ? hover : normal}
    </div>
  );
};
