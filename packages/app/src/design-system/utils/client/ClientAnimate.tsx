"use client";

import { useAutoAnimate } from "@formkit/auto-animate/react";

import { type BoxProps, BoxRef } from "../../base/Box";

export interface ClientAnimateProps extends BoxProps {
  animateOptions?: Parameters<typeof useAutoAnimate>[0];
}

export const ClientAnimate = ({ animateOptions, ...props }: ClientAnimateProps) => {
  const [animationParent] = useAutoAnimate<HTMLDivElement>(animateOptions);

  return <BoxRef {...props} ref={animationParent} />;
};
