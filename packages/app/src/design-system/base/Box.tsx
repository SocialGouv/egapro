import { fr, type FrCxArg } from "@codegouvfr/react-dsfr";
import { cx, type CxArg } from "@codegouvfr/react-dsfr/tools/cx";
import { forwardRef, type PropsWithChildren } from "react";

import { buildSpacingClasses, type SpacingProps } from "../utils/spacing";

export type BoxProps = PropsWithChildren<
  React.HTMLAttributes<HTMLDivElement> &
    SpacingProps & {
      as?: "article" | "div" | "footer" | "section";
      className?: CxArg;
      dsfrClassName?: FrCxArg;
    }
>;

const boxProps = ({
  className,
  dsfrClassName,
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
  ...rest
}: Omit<BoxProps, "as">): React.HTMLAttributes<HTMLDivElement> => ({
  className: cx(
    fr.cx(buildSpacingClasses({ mt, mr, mb, ml, mx, my, pt, pr, pb, pl, px, py }), dsfrClassName),
    className,
  ),
  ...rest,
});

export const Box = ({ as: HtmlTag = "div", ...rest }: BoxProps) => <HtmlTag {...boxProps(rest)} />;
export const BoxRef = forwardRef<HTMLDivElement, BoxProps>(({ as: HtmlTag = "div", ...rest }, ref) => (
  <HtmlTag ref={ref} {...boxProps(rest)} />
));

BoxRef.displayName = "BoxRef";
