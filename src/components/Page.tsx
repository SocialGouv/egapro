import React, { ReactNode } from "react"
import { Box, Heading, Text } from "@chakra-ui/react"

interface Props {
  title: string
  tagline?: string | Array<string>
  children: ReactNode
}

function Page({ title, tagline, children }: Props) {
  return (
    <React.Fragment>
      <Heading as="h1">{title}</Heading>
      {tagline && Array.isArray(tagline)
        ? tagline.map((tl, index) => (
            <Text mt={4} fontSize="sm" key={index}>
              {tl}
            </Text>
          ))
        : tagline && (
            <Text mt={4} fontSize="sm">
              {tagline}
            </Text>
          )}
      {children && <Box pt={6}>{children}</Box>}
    </React.Fragment>
  )
}

export default Page
