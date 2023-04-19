import { forwardRef, type PropsWithChildren } from "react";

import type { MarginProps } from "../utils/spacing";
import { Box, BoxRef } from "./Box";

export type GridProps = PropsWithChildren<
  Omit<MarginProps, "ml" | "mr" | "mx"> & { haveGutters?: boolean; justifyCenter?: boolean }
>;

export const Grid = forwardRef<HTMLDivElement, GridProps>(({ children, haveGutters, justifyCenter, ...rest }, ref) => (
  <BoxRef
    dsfrClassName={["fr-grid-row", haveGutters && "fr-grid-row--gutters", justifyCenter && "fr-grid-row--center"]}
    ref={ref}
    {...rest}
  >
    {children}
  </BoxRef>
));

Grid.displayName = "Grid";

type ColsNumberType = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

export type GridColProps = PropsWithChildren & {
  base?: ColsNumberType;
  className?: string;
  lg?: ColsNumberType;
  md?: ColsNumberType;
  sm?: ColsNumberType;
  xl?: ColsNumberType;
};

export const GridCol = ({ base = 12, sm, md, lg, xl, className, children, ...rest }: GridColProps) => (
  <Box
    className={className}
    dsfrClassName={[
      base && `fr-col-${base}`,
      sm && `fr-col-sm-${sm}`,
      md && `fr-col-md-${md}`,
      lg && `fr-col-lg-${lg}`,
      xl && `fr-col-xl-${xl}`,
    ]}
    {...rest}
  >
    {children}
  </Box>
);
