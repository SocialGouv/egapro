import React, { FunctionComponent } from "react"
import { Link, LinkProps } from "@chakra-ui/react"
import NextLink from "next/link"

type TextLinkProps = {
  to: string
} & LinkProps

const TextLink: FunctionComponent<TextLinkProps> = ({ isExternal, children, to, ...rest }) => {
  if (isExternal) {
    return (
      <Link href={to} textDecoration="underline" color="inherit" isExternal {...rest}>
        {children}
      </Link>
    )
  } else {
    return (
      <NextLink href={to} passHref>
        <Link textDecoration="underline" color="inherit" {...rest}>
          {children}
        </Link>
      </NextLink>
    )
  }
}

export default TextLink
