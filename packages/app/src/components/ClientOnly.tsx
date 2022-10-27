import type { PropsWithChildren } from "react";
import React from "react";
import { useMountedState } from "react-use";

export const ClientOnly = ({ children, ...delegated }: PropsWithChildren<unknown>) => {
  const isMounted = useMountedState();

  if (!isMounted) {
    return null;
  }
  return <div {...delegated}>{children}</div>;
};
