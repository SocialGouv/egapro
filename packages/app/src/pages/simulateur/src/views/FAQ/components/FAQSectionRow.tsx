import React, { useMemo, FunctionComponent } from "react"
import { LinkBox, LinkOverlay, Text } from "@chakra-ui/react"
import { useRouter } from "next/router"
import { IconArrowRight } from "../../../components/ds/Icons"

interface FAQSectionRowProps {
  section: string
  title: string
  detail: string
}

const FAQSectionRow: FunctionComponent<FAQSectionRowProps> = ({ section, title, detail }) => {
  const router = useRouter()
  const pathname = useMemo(() => router.pathname, [router])

  const handleClick = () => {
    // hack for `as` parameter https://nextjs.org/docs/api-reference/next/router#routerpush
    router.push({ pathname, query: { section } }, { href: "" })
  }

  return (
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
      onClick={handleClick}
    >
      <LinkOverlay
        pr={4}
        color="primary.500"
        fontWeight="bold"
        fontSize="sm"
        display="block"
        lineHeight={1.2}
        sx={{
          transition: "color .1s ease-in-out",
          _hover: { color: "primary.700" },
        }}
      >
        {title}
      </LinkOverlay>
      <IconArrowRight
        boxSize="3"
        color="gray.400"
        className="section-icon"
        sx={{
          position: "absolute",
          top: 2.5,
          right: 2,
        }}
      />
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
}

export default FAQSectionRow
