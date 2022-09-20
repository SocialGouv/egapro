import type { LinkProps } from "@chakra-ui/react";
import { Link } from "@chakra-ui/react";
import NextLink from "next/link";
import React from "react";
import type { FC } from "react";

export type TextLinkProps = LinkProps & {
  to: string;
};

export const TextLink: FC<TextLinkProps> = ({ isExternal, children, to, ...rest }) => {
  if (isExternal) {
    return (
      <Link href={to} textDecoration="underline" color="inherit" isExternal {...rest}>
        {children}
      </Link>
    );
  } else {
    return (
      <NextLink href={to} passHref>
        <Link textDecoration="underline" color="inherit" {...rest}>
          {children}
        </Link>
      </NextLink>
    );
  }
};
