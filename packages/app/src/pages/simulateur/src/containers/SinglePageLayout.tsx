import React from "react"
import Header from "../components/Header"
import Footer from "../components/Footer"
import { Box, Container, Flex } from "@chakra-ui/layout"
import { ReactNode } from "react"

interface Props {
  children: ReactNode
  size?: "container.sm" | "container.md" | "container.lg" | "container.xl"
}

const SinglePageLayout: React.FunctionComponent<Props> = ({ children, size = "container.lg" }) => {
  return (
    <Flex direction="column" minHeight="100vh">
      <Header />
      <Box as="main" role="main" flexGrow={1} py={10}>
        <Container maxW={size}>{children}</Container>
      </Box>
      <Footer />
    </Flex>
  )
}

export { SinglePageLayout }
