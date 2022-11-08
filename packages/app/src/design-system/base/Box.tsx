import clsx from "clsx";
import type { PropsWithChildren } from "react";

import type { SpacingProps } from "../utils/spacing";

export type BoxProps = PropsWithChildren<
  React.HTMLAttributes<HTMLDivElement> &
    SpacingProps & {
      as?: "article" | "div" | "footer" | "section";
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
        mt && `fr-mt-${mt}`,
        mb && `fr-mb-${mb}`,
        ml && `fr-ml-${ml}`,
        mr && `fr-mr-${mr}`,
        mx && `fr-mx-${mx}`,
        my && `fr-my-${my}`,
        pt && `fr-pt-${pt}`,
        pb && `fr-pb-${pb}`,
        pl && `fr-pl-${pl}`,
        pr && `fr-pr-${pr}`,
        px && `fr-px-${px}`,
        py && `fr-py-${py}`,
        className,
      )}
      {...rest}
    >
      {children}
    </HtmlTag>
  );
};
