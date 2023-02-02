import React, { PropsWithChildren } from "react"
import { Box, Heading, Text } from "@chakra-ui/react"
import { MessageForFrozenDeclaration } from "./MessageForFrozenDeclaration"

export type Props = PropsWithChildren<{
  title: string
  tagline?: string | Array<string>
}>

const SimulateurPage = ({ title, tagline, children }: Props) => {
  return (
    <>
      <Heading as="h1" size="lg">
        {title}
      </Heading>

      <MessageForFrozenDeclaration />

      {tagline && Array.isArray(tagline)
        ? tagline.map((tl, index) => (
            <Text mt={4} key={index}>
              {tl}
            </Text>
          ))
        : tagline && <Text mt={4}>{tagline}</Text>}

      {children && <Box pt={6}>{children}</Box>}
    </>
  )
}

export default SimulateurPage
