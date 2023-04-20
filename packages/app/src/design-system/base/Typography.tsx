import { fr, type FrCxArg } from "@codegouvfr/react-dsfr";
import { cx, type CxArg } from "@codegouvfr/react-dsfr/tools/cx";
import { type PropsWithoutChildren } from "@common/utils/types";
import { buildSpacingClasses, type SpacingProps } from "@design-system/utils/spacing";
import { forwardRef } from "react";

type TypoVariant = (typeof fr.typography)[number]["selector"];
export type TypographyProps = SpacingProps & {
  className?: CxArg;
  dsfrClassName?: FrCxArg;
  text: string;
};

const typographyProps = <P extends Omit<TypographyProps, "text">>({
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
}: P) => ({
  className: cx(
    fr.cx(buildSpacingClasses({ mt, mr, mb, ml, mx, my, pt, pr, pb, pl, px, py }), dsfrClassName),
    className,
  ),
  ...rest,
});

type HeadingVariant = `h${1 | 2 | 3 | 4 | 5 | 6}`;
type HeadingDisplay = "lg" | "md" | "sm" | "xl" | "xs";
type HeadingAttributes = PropsWithoutChildren<React.HTMLAttributes<HTMLHeadingElement>>;
export type HeadingProps = (HeadingAttributes &
  TypographyProps & {
    /** The html tag */
    as: HeadingVariant;
  }) &
  (
    | {
        /**
         * Remove `variant` to use `display`
         * @deprecated
         */
        display?: never;
        /** Should the tag looks like another? */
        variant?: HeadingVariant;
      }
    | {
        /** How should the tag be displayed? */
        display?: HeadingDisplay;
        /**
         * Remove `display` to use `variant`
         * @deprecated
         */
        variant?: never;
      }
  );

const headingProps = ({ display, variant, ...rest }: Omit<HeadingProps, "as" | "text">) => {
  const tagProps = typographyProps(rest);
  tagProps.className = cx(tagProps.className, fr.cx(display && `fr-display--${display}`, variant && `fr-${variant}`));

  return tagProps;
};

/**
 * `as` H1 => H6.
 *
 * If `variant` is provided, the element will be displayed as `as` but will
 * have the style of `variant`.
 *
 * If `display` is provided, the element will be displayed as `as` but will
 * have a dedicated style base on `display`.
 *
 * Either `variant` or `display` should be provided, not both.
 *
 * @see https://www.systeme-de-design.gouv.fr/elements-d-interface/fondamentaux-de-l-identite-de-l-etat/typographie/#:~:text=Titres%20et%20titres%20alternatifs
 */
export const Heading = ({ as: HtmlTag, text, ...rest }: HeadingProps) => {
  const tagProps = headingProps(rest);

  return <HtmlTag {...tagProps}>{text}</HtmlTag>;
};

/**
 * Ref version of {@link Heading}
 */
export const HeadingRef = forwardRef<HTMLHeadingElement, HeadingProps>(({ as: HtmlTag, text, ...rest }, ref) => {
  const tagProps = headingProps(rest);

  return (
    <HtmlTag {...tagProps} ref={ref}>
      {text}
    </HtmlTag>
  );
});
HeadingRef.displayName = "HeadingRef";

type TextVariant = TypoVariant extends infer R ? (R extends `.fr-text--${infer T}` ? T : never) : never;
type TextAttributes = React.HTMLAttributes<HTMLParagraphElement>;
export type TextProps = TextAttributes &
  TypographyProps & {
    variant?: TextVariant;
  };

const textProps = ({ variant, ...rest }: Omit<TextProps, "text">) => {
  const tagProps = typographyProps(rest);
  tagProps.className = cx(tagProps.className, fr.cx(variant && `fr-text--${variant}`));

  return tagProps;
};

/**
 * @see https://www.systeme-de-design.gouv.fr/elements-d-interface/fondamentaux-de-l-identite-de-l-etat/typographie/#:~:text=Corps%20de%20texte
 */
export const Text = ({ text, ...rest }: TextProps) => <p {...textProps(rest)}>{text}</p>;

/**
 * Ref version of {@link Text}
 */
export const TextRef = forwardRef<HTMLParagraphElement, TextProps>(({ text, ...rest }, ref) => (
  <p {...textProps(rest)} ref={ref}>
    {text}
  </p>
));
TextRef.displayName = "TextRef";
