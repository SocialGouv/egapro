import React, { PropsWithChildren } from "react"
import { Box, Heading, Text } from "@chakra-ui/react"

export type PageProps = PropsWithChildren<{
  title: string
  tagline?: string | Array<string>
}>

const Page = ({ title, tagline, children }: PageProps) => {
  return (
    <>
      <Heading as="h1" size="lg">
        {title}
      </Heading>
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

export default Page
