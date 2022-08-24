import React from "react"
import { Heading } from "@chakra-ui/layout"

function Title1({ children }: { children: string }) {
  return (
    <Heading as="h1" size="xl" isTruncated fontSize="32px" mt="36px" fontWeight="normal">
      {children}
    </Heading>
  )
}

export default Title1
