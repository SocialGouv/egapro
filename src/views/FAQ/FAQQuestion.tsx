import React, { FunctionComponent } from "react"
import { RouteComponentProps } from "react-router-dom"
import { Box, Button, Heading, Icon, Text } from "@chakra-ui/react"
import { RiArrowGoBackLine } from "react-icons/ri"

import { FAQPartType } from "../../globals"
import { faqData } from "../../data/faq"

import FAQTitle from "./components/FAQTitle"

interface FAQSectionProps {
  part: FAQPartType
  indexQuestion: number
  history: RouteComponentProps["history"]
}

const FAQSection: FunctionComponent<FAQSectionProps> = ({ part, indexQuestion, history }) => {
  const faqPart = faqData[part]
  const faqQuestion = faqPart.qr[indexQuestion]

  return (
    <React.Fragment>
      <FAQTitle mb={6}>{faqPart.title}</FAQTitle>
      <Box mb={6}>
        <Heading as="p" fontSize="md" fontWeight="bold" mb={4}>
          {faqQuestion.question}
        </Heading>
        {faqQuestion.reponse.map((reponsePara, index) => (
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
      <Button onClick={() => history.goBack()} size="sm" leftIcon={<Icon as={RiArrowGoBackLine} />} variant="link">
        Retour aux questions
      </Button>
    </React.Fragment>
  )
}

export default FAQSection
