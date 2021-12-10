import React, { FunctionComponent } from "react"
import { LinkBox, LinkOverlay, Text, Flex, Icon } from "@chakra-ui/react"
import { RiArrowDropRightLine } from "react-icons/ri"
import { Link as LinkRouter } from "react-router-dom"

interface FAQSectionRowProps {
  section: string
  title: string
  detail: string
}

const FAQSectionRow: FunctionComponent<FAQSectionRowProps> = ({ section, title, detail }) => (
  <LinkBox
    py={2}
    px={2}
    mx={-2}
    borderRadius="md"
    sx={{
      transition: "background-color .1s ease-in-out",
      _hover: {
        backgroundColor: "primary.100",
        ".section-icon": {
          color: "primary.600",
        },
        ".section-detail": {
          color: "primary.700",
        },
      },
    }}
  >
    <Flex>
      <LinkOverlay
        as={LinkRouter}
        to={{ state: { faq: `/section/${section}` } }}
        color="primary.500"
        fontWeight="bold"
        fontFamily="heading"
        fontSize="sm"
        display="block"
        lineHeight={1.2}
        sx={{
          transition: "color .1s ease-in-out",
          _hover: {
            color: "primary.700",
          },
        }}
      >
        {title}
      </LinkOverlay>
      <Icon
        boxSize={5}
        as={RiArrowDropRightLine}
        color="gray.400"
        ml="auto"
        className="section-icon"
        sx={{
          transition: "color .1s ease-in-out",
        }}
      />
    </Flex>
    <Text
      fontSize="sm"
      color="gray.600"
      className="section-detail"
      sx={{
        transition: "color .1s ease-in-out",
      }}
    >
      {detail}
    </Text>
  </LinkBox>
)

export default FAQSectionRow
