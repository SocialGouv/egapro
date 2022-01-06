import React, { FunctionComponent } from "react"
import { Link, LinkProps } from "@chakra-ui/react"
import { Link as LinkRouter } from "react-router-dom"

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
      <Link as={LinkRouter} textDecoration="underline" color="inherit" to={to} {...rest}>
        {children}
      </Link>
    )
  }
}

export default TextLink
