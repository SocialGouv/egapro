/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { RouteComponentProps } from "react-router-dom";

import globalStyles from "../../utils/globalStyles";

import FAQTitle from "./components/FAQTitle";

import faqData from "../../data/faq";

interface Props {
  section: "champApplication" | "periodeReference";
  indexQuestion: number;
  history: RouteComponentProps["history"];
}

function FAQSection({ section, indexQuestion, history }: Props) {
  const faqSection = faqData[section];
  const faqQuestion = faqSection.qr[indexQuestion];

  return (
    <div css={styles.container}>
      <FAQTitle>{faqSection.title}</FAQTitle>

      <div css={styles.content}>
        <p css={styles.question}>• {faqQuestion.question}</p>
        <div css={styles.responseBloc}>
          {faqQuestion.reponse.map((reponsePara, index) => (
            <p key={index} css={styles.responseRow}>
              {reponsePara}
            </p>
          ))}
        </div>

        <button css={styles.button} onClick={() => history.goBack()}>
          <span css={styles.buttonIcon}>◀</span> ︎retour aux questions
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: css({
    flex: 1,
    display: "flex",
    flexDirection: "column"
  }),
  content: css({
    marginBottom: 14,
    display: "flex",
    flexDirection: "column",
    alignItems: "start"
  }),
  question: css({
    marginBottom: 12,
    fontWeight: "bold",
    fontSize: 14,
    lineHeight: "17px"
  }),
  responseBloc: css({
    paddingLeft: 15
  }),
  responseRow: css({
    marginBottom: 4,
    fontSize: 14,
    lineHeight: "17px"
  }),

  button: css({
    all: "unset",
    cursor: "pointer",
    marginTop: 12,
    fontSize: 12,
    color: globalStyles.colors.women,
    textDecoration: "none"
  }),
  buttonIcon: css({
    fontSize: 8
  })
};

export default FAQSection;
