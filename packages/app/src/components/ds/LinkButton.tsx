import React from "react"
import { Flex, LinkBox, LinkOverlay, Spacer } from "@chakra-ui/react"

type LinkButtonProps = {
  children: React.ReactNode
  color?: string
  href: string
  isExternal?: boolean
  leftIcon?: React.ReactNode
}

export function LinkButton({
  children,
  color = "primary.500",
  href,
  isExternal = false,
  leftIcon = null,
  ...rest
}: LinkButtonProps) {
  return (
    <LinkBox>
      <LinkOverlay href={href} isExternal={isExternal}>
        <Flex
          justify="center"
          align="center"
          border="1px solid"
          width="fit-content"
          px={3}
          py={2}
          borderRadius="lg"
          borderColor={color}
          margin="auto"
          {...rest}
        >
          {leftIcon}
          <Spacer ml={2} />
          {children}
        </Flex>
      </LinkOverlay>
    </LinkBox>
  )
}
