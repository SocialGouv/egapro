import clsx from "clsx";
import type { PropsWithChildren } from "react";

import { Box } from "../base/Box";
import type { SpacingProps } from "../utils/spacing";

export type ContainerProps = PropsWithChildren<
  Omit<SpacingProps, "ml" | "mr" | "mx" | "pl" | "pr" | "px"> & {
    className?: string;
  }
>;

export const Container = ({ children, className, ...rest }: ContainerProps) => {
  return (
    <Box className={clsx("fr-container", className)} {...rest}>
      {children}
    </Box>
  );
};
