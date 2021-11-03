/** @jsx jsx */
import { css, jsx } from "@emotion/core"
import { useState, ReactNode } from "react"

import FAQSearchBox from "./components/FAQSearchBox"
import FAQQuestionRow from "./components/FAQQuestionRow"
import FAQTitle2 from "./components/FAQTitle2"

import faqDataFuse from "./utils/faqFuse"

interface Props {
  children: ReactNode
}

function FAQSearch({ children }: Props) {
  const [searchTerm, setSearchTerm] = useState("")

  const fuseResults = searchTerm !== "" ? faqDataFuse.search(searchTerm) : null

  return (
    <div css={styles.container}>
      <FAQSearchBox searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

      {searchTerm === "" ? (
        children
      ) : (
        <div css={styles.content}>
          {fuseResults ? (
            fuseResults.map(({ item: { part, title, index, question } }) => (
              <div css={styles.part} key={part + index}>
                <FAQTitle2>{title}</FAQTitle2>
                <FAQQuestionRow part={part} index={index} question={question} />
              </div>
            ))
          ) : (
            <p>Pas de résultat</p>
          )}
        </div>
      )}
    </div>
  )
}

const styles = {
  container: css({
    display: "flex",
    flexDirection: "column",
  }),
  content: css({
    marginTop: 28,
    marginBottom: 14,
    display: "flex",
    flexDirection: "column",
  }),
  part: css({
    marginTop: 14,
  }),
}

export default FAQSearch
