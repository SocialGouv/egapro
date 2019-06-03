/** @jsx jsx */
import { css, jsx } from "@emotion/core";

import FAQSearchBox from "./components/FAQSearchBox";
import FAQSectionRow from "./components/FAQSectionRow";

import faqDataRaw from "../../data/faq";

const faqData = Object.entries(faqDataRaw);

function FAQHome() {
  return (
    <div css={styles.container}>
      <FAQSearchBox />

      <div css={styles.content}>
        {faqData.map(([faqKey, faqDatum]) => (
          <FAQSectionRow
            key={faqKey}
            title={faqDatum.title}
            detail={`${faqDatum.qr.length} articles`}
          />
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
    marginTop: 14,
    marginBottom: 14,
    display: "flex",
    flexDirection: "column"
  })
};

export default FAQHome;
