import React, { PropsWithChildren } from "react"
import { Heading } from "@chakra-ui/react"

function Title1({ children }: PropsWithChildren) {
  return (
    <Heading as="h1" size="xl" noOfLines={1} fontSize="32px" mt="36px" fontWeight="normal">
      {children}
    </Heading>
  )
}

export default Title1
