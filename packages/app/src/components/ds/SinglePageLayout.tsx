import React, { ReactNode } from "react"
import { Box, Container, Flex } from "@chakra-ui/layout"

import Header from "@/components/ds/Header"
import Footer from "@/components/ds/Footer"

interface Props {
  children: ReactNode
}

export function SinglePageLayout({ children }: Props) {
  return (
    <Flex direction="column" minHeight="100vh">
      <Header />
      <Box as="main" role="main" id="main" flexGrow={1} pt={10}>
        <Container maxW="container.lg">{children}</Container>
      </Box>
      <Footer />
    </Flex>
  )
}
