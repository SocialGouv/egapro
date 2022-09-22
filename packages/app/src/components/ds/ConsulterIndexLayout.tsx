import { Box, Container, Flex } from "@chakra-ui/layout";
import type { PropsWithChildren } from "react";
import React from "react";

import { Footer } from "./Footer";
import { Header } from "./Header";

// eslint-disable-next-line @typescript-eslint/ban-types -- no props
export const ConsulterIndexLayout = ({ children }: PropsWithChildren<{}>) => {
  return (
    <Flex direction="column" minHeight="100vh">
      <Header />
      <Box as="main" role="main" id="main" flexGrow={1} pt={10}>
        <Container maxW="container.lg">{children}</Container>
      </Box>
      <Footer />
    </Flex>
  );
};
