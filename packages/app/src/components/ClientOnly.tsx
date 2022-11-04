import type { PropsWithChildren } from "react";
import { useEffect, useState } from "react";
import React from "react";

export const ClientOnly = ({ children, ...delegated }: PropsWithChildren<unknown>) => {
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => {
    setHasMounted(true);
  }, []);
  if (!hasMounted) {
    return null;
  }
  return <div {...delegated}>{children}</div>;
};
