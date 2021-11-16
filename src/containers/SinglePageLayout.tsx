import React from "react"
import Header from "../components/Header"
import Footer from "../components/Footer"
import { Box, Flex } from "@chakra-ui/layout"
import { ReactNode } from "react"

interface Props {
  children: ReactNode
}

export function SinglePageLayout({ children }: Props) {
  return (
    <Flex direction="column" minHeight="100vh">
      <Header />
      <Box flexGrow={1}>{children}</Box>
      <Footer />
    </Flex>
  )
}
