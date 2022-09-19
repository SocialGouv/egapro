import { Container, Box, Flex, Grid, useMediaQuery } from "@chakra-ui/react";
import { useRouter } from "next/router";
import type { ReactNode, FunctionComponent } from "react";
import React, { useEffect, useMemo, useState } from "react";
import { Footer } from "./ds/Footer";
import { Header } from "./ds/Header";

export interface StaticPageWithFaqLayoutProps {
  children: ReactNode;
}

export const StaticPageWithFaqLayout: FunctionComponent<StaticPageWithFaqLayoutProps> = ({ children }) => {
  const router = useRouter();
  const [isLargerThan1280, setIsLargerThan1280] = useState<boolean>(false);
  const [mediaQuery] = useMediaQuery("(min-width: 1280px)");

  useEffect(() => {
    if (mediaQuery !== isLargerThan1280) {
      setIsLargerThan1280(mediaQuery);
    }
  }, [isLargerThan1280, mediaQuery]);

  const gridTemplateColumnsVal = useMemo(
    () => (isLargerThan1280 ? "200px 1fr 380px" : "200px 1fr"),
    [isLargerThan1280],
  );
  const gridTemplateAreasVal = useMemo(
    () => (isLargerThan1280 ? "'nav main aside'" : "'nav main'"),
    [isLargerThan1280],
  );
  return (
    <Flex direction="column">
      <Header />
      <Flex
        grow={1}
        sx={{
          height: "100%",
        }}
        as={"main"}
        role="main"
        id="main"
      >
        <Container maxW={{ base: "container.lg", xl: "container.xl" }}>
          <Grid
            sx={{
              "@media screen": {
                gridTemplateColumns: gridTemplateColumnsVal,
                gridTemplateRows: "auto",
                gridTemplateAreas: gridTemplateAreasVal,
                height: "100%",
              },
            }}
          >
            {isLargerThan1280 && (
              <Box
                ml={-3}
                sx={{
                  gridArea: "nav",
                  "@media print": {
                    display: "none",
                    marginLeft: 0,
                    borderRight: "none",
                  },
                }}
              />
            )}
            <Content pathname={router?.pathname}>{children}</Content>
            {isLargerThan1280 && (
              <Box
                bg="white"
                mr={isLargerThan1280 ? -3 : 0}
                sx={{
                  gridArea: "aside",
                  "@media print": {
                    display: "none",
                  },
                }}
              />
            )}
          </Grid>
        </Container>
      </Flex>
      <Footer />
    </Flex>
  );
};

interface ContentProps {
  pathname: string;
}

const Content: React.FC<ContentProps> = ({ children, pathname }) => {
  const [isLargerThan1280, setIsLargerThan1280] = useState<boolean>(false);
  const [mediaQuery] = useMediaQuery("(min-width: 1280px)");

  useEffect(() => {
    if (mediaQuery !== isLargerThan1280) {
      setIsLargerThan1280(mediaQuery);
    }
  }, [isLargerThan1280, mediaQuery]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <Box
      px={isLargerThan1280 ? 8 : 0}
      py={isLargerThan1280 ? 10 : 6}
      sx={{
        gridArea: "main",
        borderRight: isLargerThan1280 ? "1px solid #E3E4ED" : "none",
        "@media print": {
          paddingLeft: 0,
          paddingRight: 0,
          borderRight: "none",
        },
      }}
    >
      {children}
    </Box>
  );
};
