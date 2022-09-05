import React, { useMemo, FunctionComponent } from "react"
import { useRouter } from "next/router"
import { Box, Button, Heading, Text } from "@chakra-ui/react"

import { FAQPartType } from "../../globals"
import { faqData } from "../../data/faq"

import FAQTitle from "./components/FAQTitle"
import { IconBack } from "../../components/ds/Icons"

interface FAQSectionProps {
  part: FAQPartType
  indexQuestion: number
  section: string
}

const FAQQuestion: FunctionComponent<FAQSectionProps> = ({ part, indexQuestion, section }) => {
  const router = useRouter()
  const pathname = useMemo(() => router.pathname, [router])
  const faqPart = useMemo(() => (part ? faqData[part as FAQPartType] : undefined), [part])
  const faqQuestion = useMemo(() => (faqPart ? faqPart.qr[Number(indexQuestion)] : undefined), [faqPart])

  const handleClick = () => {
    // hack for `as` parameter https://nextjs.org/docs/api-reference/next/router#routerpush
    router.push({ pathname, query: { part: undefined, indexQuestion: undefined, section } }, { href: "" })
  }

  return (
    <React.Fragment>
      <FAQTitle mb={6}>{faqPart?.title}</FAQTitle>
      <Box mb={6}>
        <Heading as="p" fontSize="md" fontWeight="bold" mb={4}>
          {faqQuestion?.question}
        </Heading>
        {faqQuestion?.reponse?.map((reponsePara, index) => (
          <Text
            key={index}
            fontSize="sm"
            sx={{
              "&:not(:last-child)": {
                marginBottom: 2,
              },
            }}
          >
            {reponsePara}
          </Text>
        ))}
      </Box>
      <Button onClick={handleClick} size="sm" leftIcon={<IconBack />} variant="link">
        Retour aux questions
      </Button>
    </React.Fragment>
  )
}

export default FAQQuestion
