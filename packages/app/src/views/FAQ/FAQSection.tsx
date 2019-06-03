/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { Link } from "react-router-dom";

import globalStyles from "../../utils/globalStyles";

import FAQSearchBox from "./components/FAQSearchBox";
import FAQTitle from "./components/FAQTitle";

import faqData from "../../data/faq";

interface Props {
  section:
    | "champApplication"
    | "periodeReference"
    | "effectifs"
    | "remuneration"
    | "indicateur1"
    | "indicateur2et3"
    | "indicateur4"
    | "publication";
}

function FAQSection({ section }: Props) {
  const faqSection = faqData[section];

  return (
    <div css={styles.container}>
      <FAQTitle>{faqSection.title}</FAQTitle>

      <FAQSearchBox />

      <div css={styles.content}>
        {faqSection.qr.map(({ question }, index) => (
          <Link
            key={index}
            to={{ state: { faq: `/section/${section}/question/${index}` } }}
            css={styles.link}
          >
            <p css={styles.questionRow}>• {question}</p>
          </Link>
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
  }),

  link: css({
    color: globalStyles.colors.default,
    textDecoration: "none"
  })
};

export default FAQSection;
