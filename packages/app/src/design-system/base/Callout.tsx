import clsx from "clsx";
import type { FunctionComponent, HTMLAttributes, ReactNode } from "react";
import type { SimpleObject } from "@common/utils/types";

export type CalloutProps = HTMLAttributes<HTMLDivElement> & {
  buttonLabel?: string;
  className?: string;
  color?: string;
  cta?: VoidFunction;
  title?: string;
  titleSize?: "lg" | "md" | "sm" | "xl" | "xs";
};

export const Callout: FunctionComponent<CalloutProps> = ({
  buttonLabel,
  children,
  className,
  color,
  cta,
  title,
  titleSize,
  ...rest
}) => {
  const getColor = (colorInput: string): string => `fr-callout--${colorInput}`;

  const titleSizes: SimpleObject<(_title: string) => ReactNode> = {
    xs: _title => <h2 className="fr-callout__title">{_title}</h2>,
    sm: _title => <h3 className="fr-callout__title">{_title}</h3>,
    md: _title => <h4 className="fr-callout__title">{_title}</h4>,
    lg: _title => <h5 className="fr-callout__title">{_title}</h5>,
    xl: _title => <h6 className="fr-callout__title">{_title}</h6>,
  };

  const getTitle = (titleSize && titleSizes[titleSize]) ?? (title => <h3 className="fr-callout__title">{title}</h3>);

  return (
    <div className={clsx("fr-callout", "fr-fi-information-line", color && getColor(color), className)}>
      {title && getTitle(title)}
      <p className="fr-callout__text">{children}</p>
      {buttonLabel && (
        <button className="fr-btn" onClick={cta}>
          {buttonLabel}
        </button>
      )}
    </div>
  );
};
