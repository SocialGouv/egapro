/** @jsx jsx */
import { css, jsx } from "@emotion/core";

import FAQSearch from "./FAQSearch";
import FAQSectionRow from "./components/FAQSectionRow";

import { faqSections, faqData } from "../../data/faq";

const faqSectionsEntries = Object.entries(faqSections);

function FAQHome() {
  return (
    <div css={styles.container}>
      <FAQSearch>
        <div css={styles.content}>
          {faqSectionsEntries.map(([faqKey, faqSection]) => {
            const questionsLength = faqSection.parts.reduce(
              (acc, part) => acc + faqData[part].qr.length,
              0
            );
            return (
              <FAQSectionRow
                key={faqKey}
                section={faqKey}
                title={faqSection.title}
                detail={`${questionsLength} article${
                  questionsLength > 1 ? "s" : ""
                }`}
              />
            );
          })}
        </div>
      </FAQSearch>
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
