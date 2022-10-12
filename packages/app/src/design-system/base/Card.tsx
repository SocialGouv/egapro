import clsx from "clsx";
import type { PropsWithChildren } from "react";

import type { IconStyles } from "../utils/icon-styles";
import type { MarginProps } from "../utils/spacing";
import { Box } from "./Box";

export type CardProps = PropsWithChildren<
  Omit<MarginProps, "ml" | "mr" | "mx"> & {
    size?: "lg" | "sm";
  }
>;

export const Card = ({ children, size, ...rest }: CardProps) => {
  return (
    <Box className={clsx("fr-card", size === "sm" && "fr-card--sm", size === "lg" && "fr-card--lg")} {...rest}>
      {children}
    </Box>
  );
};

export const CardBody = ({ children }: PropsWithChildren<Record<never, never>>) => (
  <div className="fr-card__body">{children}</div>
);

export const CardBodyContent = ({ children }: PropsWithChildren<Record<never, never>>) => (
  <div className="fr-card__content">{children}</div>
);

export type CardBodyContentTitleProps = PropsWithChildren<{
  titleAs?: "h2" | "h3" | "h4" | "h5" | "h6" | "p";
}>;

export const CardBodyContentTitle = ({ children, titleAs: HtmlTag = "p" }: CardBodyContentTitleProps) => {
  return <HtmlTag className="fr-card__title">{children}</HtmlTag>;
};

export const CardBodyContentDescription = ({ children }: PropsWithChildren<Record<never, never>>) => (
  <p className="fr-card__desc">{children}</p>
);

export type CardBodyContentLegendProps = PropsWithChildren<{ icon?: IconStyles }>;

export const CardBodyContentLegend = ({ children, icon }: CardBodyContentLegendProps) => (
  <div className="fr-card__start">
    <p className={clsx("fr-card__detail", icon)}>{children}</p>
  </div>
);

export const CardBodyFooter = ({ children }: PropsWithChildren<Record<never, never>>) => (
  <div className="fr-card__footer">{children}</div>
);
