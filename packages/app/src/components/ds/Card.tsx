import { Box, Heading, Image, Text, Flex } from "@chakra-ui/react";
import React from "react";

export type CardProps = {
  action: React.ReactElement;
  content: string;
  img: {
    alt?: string;
    url: string;
  };
  legend: string;
  title: {
    node: "h2" | "h3" | "h4" | "h5" | "h6" | "p";
    text: string;
  };
};

export const Card: React.FC<CardProps> = ({ img, legend, title, content, action }) => (
  <Flex p={{ base: 4, lg: 6 }} direction="column" bg="white" borderRadius="lg" borderWidth={1}>
    <Image src={`${img.url}`} aria-hidden="true" alt={img.alt || ""} />
    <Box mt={{ base: 3, lg: 4 }} flexGrow={1}>
      <Text fontSize="sm" color="primary.500" fontWeight="normal" mb={1}>
        {legend}
      </Text>
      <Heading fontSize="xl" as={title.node} fontFamily="font.body">
        {title.text}
      </Heading>
      <Text mt={2} fontSize="sm">
        {content}
      </Text>
    </Box>
    <Box mt={4}>{action}</Box>
  </Flex>
);
