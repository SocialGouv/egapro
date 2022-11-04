import { Box, Container, Flex } from "@chakra-ui/layout";
import { ChakraProvider } from "@chakra-ui/react";
import Head from "next/head";
import type { PropsWithChildren } from "react";
import React from "react";
import { theme } from "../../theme";

import { Footer } from "../ds/Footer";
import { Header } from "@components/ds/Header";
/**
 * Layout for consulter pages.
 */
export const ConsulterIndexLayout = ({ children, title }: PropsWithChildren & { title?: string | undefined }) => {
  return (
    <ChakraProvider theme={theme}>
      <Head>
        <title>{title && title + " - "} Egapro</title>
      </Head>
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
