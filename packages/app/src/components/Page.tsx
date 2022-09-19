import { Box, Heading, Text } from "@chakra-ui/react";
import Head from "next/head";
import React from "react";

export interface PageProps {
  tagline?: string[] | string;
  title: string;
}

export const Page: React.FC<PageProps> = ({ title, tagline, children }) => {
  return (
    <>
      <Head>
        <title>{`${title} - Index Egapro`}</title>
      </Head>
      <Heading as="h1" size="lg">
        {title}
      </Heading>
      {tagline && Array.isArray(tagline)
        ? tagline.map((tl, index) => (
            <Text mt={4} key={index}>
              {tl}
            </Text>
          ))
        : tagline && <Text mt={4}>{tagline}</Text>}
      {children && <Box pt={6}>{children}</Box>}
    </>
  );
};
