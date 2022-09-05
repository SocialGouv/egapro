import React, { useMemo, FunctionComponent } from "react"
import { Text, Link } from "@chakra-ui/react"
import { useRouter } from "next/router"

interface FAQQuestionRowProps {
  part: string
  index: number
  question: string
  section: string
}

const FAQQuestionRow: FunctionComponent<FAQQuestionRowProps> = ({ part, index, question, section }) => {
  const router = useRouter()
  const pathname = useMemo(() => router.pathname, [router])

  const handleClick = () => {
    // hack for `as` parameter https://nextjs.org/docs/api-reference/next/router#routerpush
    router.push({ pathname, query: { part, indexQuestion: index, section } }, { href: "" })
  }
  return (
    <Text fontSize="sm">
      <Link display="inline-block" onClick={handleClick}>
        {question}
      </Link>
    </Text>
  )
}

export default FAQQuestionRow
