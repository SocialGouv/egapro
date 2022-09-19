import { Box, Container, Flex } from "@chakra-ui/react";
import type { ReactNode } from "react";
import React from "react";

import { Footer } from "./Footer";
import { Header } from "./Header";

interface Props {
  children: ReactNode;
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
  );
}
