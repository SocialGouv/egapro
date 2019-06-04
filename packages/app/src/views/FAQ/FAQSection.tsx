/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { Fragment } from "react";
import { Link } from "react-router-dom";

import { FAQSectionType } from "../../globals.d";

import globalStyles from "../../utils/globalStyles";

import FAQSearchBox from "./components/FAQSearchBox";
import FAQTitle from "./components/FAQTitle";
import FAQTitle2 from "./components/FAQTitle2";

import FAQEffectifsSteps from "./components-steps/FAQEffectifsSteps";
import FAQIndicateur2Steps from "./components-steps/FAQIndicateur2Steps";

import { faqData, faqSections } from "../../data/faq";

interface Props {
  section: FAQSectionType;
}

function FAQSection({ section }: Props) {
  const faqSection = faqSections[section];

  const FAQStepsElement = FAQSteps({ section });

  return (
    <div css={styles.container}>
      <FAQTitle>{faqSection.title}</FAQTitle>

      <FAQSearchBox />

      <div css={styles.content}>
        {FAQStepsElement && (
          <div css={styles.pasapas}>
            <FAQTitle2>L'essentiel</FAQTitle2>

            {FAQStepsElement}
          </div>
        )}

        {faqSection.parts.length > 0 && (
          <Fragment>
            <FAQTitle2>Les questions récurrentes</FAQTitle2>
            {faqSection.parts.map(part => {
              const faqPart = faqData[part];
              return faqPart.qr.map(({ question }, index) => (
                <Link
                  key={part + index}
                  to={{ state: { faq: `/part/${part}/question/${index}` } }}
                  css={styles.link}
                >
                  <p css={styles.questionRow}>• {question}</p>
                </Link>
              ));
            })}
          </Fragment>
        )}
      </div>
    </div>
  );
}

function FAQSteps({ section }: Props) {
  switch (section) {
    case "effectifs":
      return <FAQEffectifsSteps />;
    case "indicateur1":
      return <FAQIndicateur2Steps />;
    case "indicateur2":
      return <FAQIndicateur2Steps />;
    case "indicateur3":
      return <FAQIndicateur2Steps />;
    case "indicateur4":
      return <FAQIndicateur2Steps />;
    case "indicateur5":
      return <FAQIndicateur2Steps />;
    case "resultat":
      return <FAQIndicateur2Steps />;
    default:
      return null;
  }
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
  pasapas: css({
    marginBottom: 28
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
