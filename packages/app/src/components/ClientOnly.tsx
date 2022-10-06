import type { PropsWithChildren } from "react";
import React from "react";

export const ClientOnly = ({ children, ...delegated }: PropsWithChildren<unknown>) => {
  const [hasMounted, setHasMounted] = React.useState(false);
  React.useEffect(() => {
    setHasMounted(true);
  }, []);
  if (!hasMounted) {
    return null;
  }
  return <div {...delegated}>{children}</div>;
};
