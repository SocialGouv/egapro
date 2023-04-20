import { type FrCxArg } from "@codegouvfr/react-dsfr";

import { Box, type BoxProps } from "../base/Box";

export type ContainerProps = Omit<BoxProps, "ml" | "mr" | "mx" | "pl" | "pr" | "px"> & {
  fluid?: boolean;
  size?: "lg" | "md" | "sm" | "xl";
};

export const Container = ({ children, dsfrClassName, fluid, size, ...rest }: ContainerProps) => {
  let containerClass = "fr-container";
  if (size) containerClass += `-${size}`;
  if (fluid) containerClass += `--fluid`;
  return (
    <Box dsfrClassName={[dsfrClassName, containerClass as FrCxArg]} {...rest}>
      {children}
    </Box>
  );
};
