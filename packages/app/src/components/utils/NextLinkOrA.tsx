import { type HTMLAnchorProps } from "@common/utils/react-props";
import Link, { type LinkProps } from "next/link";
import { type PropsWithChildren } from "react";

type NextLinkProps = LinkProps & Omit<HTMLAnchorProps, keyof LinkProps>;
type ANoHref = Omit<HTMLAnchorProps, "href">;
type Href = NonNullable<HTMLAnchorProps["href"]>;
type NextHref = NonNullable<NextLinkProps["href"]>;

export type NextLinkOrAProps = PropsWithChildren<
  | ANoHref
  | (HTMLAnchorProps & {
      href: Href;
      /** Is the link outside of the router? */
      isExternal: true;
    })
  | (NextLinkProps & { href: NextHref; isExternal?: false })
>;
const removeIsExternal = <T extends NextLinkOrAProps>(props: T) => {
  if (!("isExternal" in props)) return props;
  const { isExternal: _, ...rest } = props;
  return rest;
};

/**
 * Wrapper around Next.js' Link component that can also be used as a regular <a> tag when no href is provided.
 */
export const NextLinkOrA = ({ children, ...rest }: NextLinkOrAProps) =>
  "href" in rest ? (
    rest.isExternal ? (
      <a {...removeIsExternal(rest)}>{children}</a>
    ) : (
      <Link {...removeIsExternal(rest)}>{children}</Link>
    )
  ) : (
    <a {...rest}>{children}</a>
  );
