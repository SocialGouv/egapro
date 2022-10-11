import clsx from "clsx";
import type { PropsWithChildren } from "react";

import { Box } from "../base/Box";
import type { MarginProps } from "../utils/spacing";

export type LinkGroupProps = PropsWithChildren<
  Omit<MarginProps, "ml" | "mr" | "mx"> & {
    className?: string;
  }
>;

export const LinkGroup = ({ className, children, ...rest }: LinkGroupProps) => {
  return (
    <Box className={clsx("fr-links-group", className)} {...rest}>
      {children}
    </Box>
  );
};
