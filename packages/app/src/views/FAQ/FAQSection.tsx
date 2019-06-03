/** @jsx jsx */
import { css, jsx } from "@emotion/core";

import FAQSearchBox from "./components/FAQSearchBox";
import FAQTitle from "./components/FAQTitle";

import faqData from "../../data/faq";

interface Props {
  section: "champApplication" | "periodeReference";
}

function FAQSection({ section }: Props) {
  const faqSection = faqData[section];

  return (
    <div css={styles.container}>
      <div css={css({ marginBottom: 26 })}>
        <FAQTitle>{faqSection.title}</FAQTitle>
      </div>

      <FAQSearchBox />

      <div css={styles.content}>
        {faqSection.qr.map(({ question }, index) => (
          <p key={index} css={styles.questionRow}>
            • {question}
          </p>
        ))}
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
    marginTop: 28,
    marginBottom: 14,
    display: "flex",
    flexDirection: "column"
  }),
  questionRow: css({
    marginBottom: 12,

    fontSize: 14,
    lineHeight: "17px"
  })
};

export default FAQSection;
