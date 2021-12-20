import React, { FunctionComponent } from "react"
import { chakra, Link, LinkProps } from "@chakra-ui/react"
import { Link as LinkRouter } from "react-router-dom"

type TextLinkProps = {
  to: string
} & LinkProps

const LinkChakraRouter = chakra(LinkRouter, {
  baseStyle: {
    textDecoration: "underline",
    color: "inherit",
  },
})

const TextLink: FunctionComponent<TextLinkProps> = ({ isExternal, children, to, ...rest }) => {
  if (isExternal) {
    return (
      <Link href={to} textDecoration="underline" color="inherit" isExternal {...rest}>
        {children}
      </Link>
    )
  } else {
    return (
      <LinkChakraRouter to={to} {...rest}>
        {children}
      </LinkChakraRouter>
    )
  }
}

export default TextLink
