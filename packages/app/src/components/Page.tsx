import React, { FunctionComponent, ReactNode } from "react"
import Head from "next/head"
import { Box, Heading, Text } from "@chakra-ui/react"

interface PageProps {
  title: string
  tagline?: string | Array<string>
  children: ReactNode
}

const Page: FunctionComponent<PageProps> = ({ title, tagline, children }) => {
  return (
    <>
      <Head>
        <title>{`${title} - Index Egapro`}</title>
      </Head>
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
