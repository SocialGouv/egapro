/** @jsx jsx */
import { css, jsx } from "@emotion/core"
import { RouteComponentProps } from "react-router-dom"

import { FAQPartType } from "../../globals"

import ActionLink from "../../components/ActionLink"

import FAQTitle from "./components/FAQTitle"

import { faqData } from "../../data/faq"

interface Props {
  part: FAQPartType
  indexQuestion: number
  history: RouteComponentProps["history"]
}

function FAQSection({ part, indexQuestion, history }: Props) {
  const faqPart = faqData[part]
  const faqQuestion = faqPart.qr[indexQuestion]

  return (
    <div css={styles.container}>
      <FAQTitle>{faqPart.title}</FAQTitle>

      <div css={styles.content}>
        <p css={styles.question}>• {faqQuestion.question}</p>
        <div css={styles.responseBloc}>
          {faqQuestion.reponse.map((reponsePara, index) => (
            <p key={index} css={styles.responseRow}>
              {reponsePara}
            </p>
          ))}
        </div>

        <ActionLink style={styles.button} onClick={() => history.goBack()}>
          <span css={styles.buttonIcon}>◀</span> ︎retour aux questions
        </ActionLink>
      </div>
    </div>
  )
}

const styles = {
  container: css({}),
  content: css({
    marginBottom: 14,
  }),
  question: css({
    marginBottom: 12,
    fontWeight: "bold",
    fontSize: 14,
    lineHeight: "17px",
  }),
  responseBloc: css({
    paddingLeft: 15,
    marginBottom: 12,
  }),
  responseRow: css({
    marginBottom: 4,
    fontSize: 14,
    lineHeight: "17px",
  }),

  button: css({
    fontSize: 12,
    textDecoration: "none",
  }),
  buttonIcon: css({
    fontSize: 8,
    fontFamily: "Segoe UI Symbol", // fix Edge
  }),
}

export default FAQSection
