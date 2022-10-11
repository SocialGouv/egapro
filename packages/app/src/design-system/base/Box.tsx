import clsx from "clsx";
import type { PropsWithChildren } from "react";
import type { SpacingProps } from "../utils/spacing";

export type BoxProps = PropsWithChildren<
  React.HTMLAttributes<HTMLDivElement> &
    SpacingProps & {
      as?: "article" | "div" | "footer" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "header" | "li" | "p" | "ul";
      className?: string;
    }
>;

export const Box = ({
  as: HtmlTag = "div",
  className,
  mt,
  mr,
  mb,
  ml,
  mx,
  my,
  pt,
  pr,
  pb,
  pl,
  px,
  py,
  children,
  ...rest
}: BoxProps) => {
  return (
    <HtmlTag
      className={clsx(
        mt && `fr-mt-md-${mt}`,
        mb && `fr-mb-md-${mb}`,
        ml && `fr-ml-md-${ml}`,
        mr && `fr-mr-md-${mr}`,
        mx && `fr-mx-md-${mx}`,
        my && `fr-my-md-${my}`,
        pt && `fr-pt-md-${pt}`,
        pb && `fr-pb-md-${pb}`,
        pl && `fr-pl-md-${pl}`,
        pr && `fr-pr-md-${pr}`,
        px && `fr-px-md-${px}`,
        py && `fr-py-md-${py}`,
        className,
      )}
      {...rest}
    >
      {children}
    </HtmlTag>
  );
};
