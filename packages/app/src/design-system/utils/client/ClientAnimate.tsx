"use client";

import { useAutoAnimate } from "@formkit/auto-animate/react";

import { type BoxProps, BoxRef } from "../../base/Box";

export const ClientAnimate = (props: BoxProps) => {
  const [animationParent] = useAutoAnimate<HTMLDivElement>();

  return <BoxRef {...props} ref={animationParent} />;
};
