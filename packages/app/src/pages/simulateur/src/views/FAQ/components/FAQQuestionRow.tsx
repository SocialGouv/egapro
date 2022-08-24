import React, { FunctionComponent } from "react"
import { Text, Link } from "@chakra-ui/react"
import { Link as LinkRouter } from "react-router-dom"

interface FAQQuestionRowProps {
  part: string
  index: number
  question: string
}

const FAQQuestionRow: FunctionComponent<FAQQuestionRowProps> = ({ part, index, question }) => (
  <Text fontSize="sm">
    <Link as={LinkRouter} to={{ state: { faq: `/part/${part}/question/${index}` } }} display="inline-block">
      {question}
    </Link>
  </Text>
)

export default FAQQuestionRow
