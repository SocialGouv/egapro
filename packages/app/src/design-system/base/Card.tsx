import clsx from "clsx";
import type { PropsWithChildren } from "react";

import type { IconStyles } from "../utils/icon-styles";
import type { MarginProps } from "../utils/spacing";
import { Box } from "./Box";

export type CardProps = PropsWithChildren<
  Omit<MarginProps, "ml" | "mr" | "mx"> & {
    isEnlargeLink?: boolean;
    isHorizontal?: boolean;
    noBorder?: boolean;
    size?: "lg" | "sm";
  }
>;

export const Card = ({ children, size, isEnlargeLink, noBorder, isHorizontal, ...rest }: CardProps) => {
  return (
    <Box
      className={clsx(
        "fr-card",
        size === "sm" && "fr-card--sm",
        size === "lg" && "fr-card--lg",
        isEnlargeLink && "fr-enlarge-link",
        noBorder && "fr-card--no-border",
        isHorizontal && "fr-card--horizontal",
      )}
      {...rest}
    >
      {children}
    </Box>
  );
};

export const CardBody = ({ children }: PropsWithChildren) => <div className="fr-card__body">{children}</div>;

export const CardBodyContent = ({ children }: PropsWithChildren) => <div className="fr-card__content">{children}</div>;

export const CardBodyContentEnd = ({ children }: PropsWithChildren) => <div className="fr-card__end">{children}</div>;

export const CardBodyContentStart = ({ children }: PropsWithChildren) => (
  <div className="fr-card__start">{children}</div>
);

export type CardBodyContentTitleProps = PropsWithChildren<{
  titleAs?: "h2" | "h3" | "h4" | "h5" | "h6" | "p";
}>;

export const CardBodyContentTitle = ({ children, titleAs: HtmlTag = "p" }: CardBodyContentTitleProps) => {
  return <HtmlTag className="fr-card__title">{children}</HtmlTag>;
};

export const CardBodyContentDescription = ({ children }: PropsWithChildren) => (
  <p className="fr-card__desc">{children}</p>
);

export type CardBodyContentLegendProps = PropsWithChildren<{ icon?: IconStyles }>;

export const CardBodyContentDetails = ({ children, icon }: CardBodyContentLegendProps) => (
  <p className={clsx("fr-card__detail", icon)}>{children}</p>
);

export const CardBodyFooter = ({ children }: PropsWithChildren) => <div className="fr-card__footer">{children}</div>;

export const CardHeader = ({ children }: PropsWithChildren) => <div className="fr-card__header">{children}</div>;

export const CardHeaderImg = ({ children }: PropsWithChildren) => <div className="fr-card__img">{children}</div>;
