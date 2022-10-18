import { Box, Container, Flex } from "@chakra-ui/layout";
import { ChakraProvider } from "@chakra-ui/react";
import type { PropsWithChildren } from "react";
import React from "react";
import { theme } from "../../theme";

import { Footer } from "../ds/Footer";
import { Header } from "../ds/Header";

export const ConsulterIndexLayout = ({ children }: PropsWithChildren) => {
  return (
    <ChakraProvider theme={theme}>
      <Flex direction="column" minHeight="100vh">
        <Header />
        <Box as="main" role="main" id="main" flexGrow={1} pt={10}>
          <Container maxW="container.lg">{children}</Container>
        </Box>
        <Footer />
      </Flex>
    </ChakraProvider>
  );
};
