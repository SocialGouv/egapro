/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { Fragment } from "react";
import { Link } from "react-router-dom";

import { FAQSectionType } from "../../globals.d";

import globalStyles from "../../utils/globalStyles";

import FAQSearch from "./FAQSearch";
import FAQTitle from "./components/FAQTitle";
import FAQTitle2 from "./components/FAQTitle2";
import FAQQuestionRow from "./components/FAQQuestionRow";

import FAQEffectifsSteps from "./components-steps/FAQEffectifsSteps";
import FAQIndicateur1Steps from "./components-steps/FAQIndicateur1Steps";
import FAQIndicateur2Steps from "./components-steps/FAQIndicateur2Steps";
import FAQIndicateur3Steps from "./components-steps/FAQIndicateur3Steps";
import FAQIndicateur4Steps from "./components-steps/FAQIndicateur4Steps";
import FAQIndicateur5Steps from "./components-steps/FAQIndicateur5Steps";
import FAQResultatSteps from "./components-steps/FAQResultatSteps";

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

      <FAQSearch>
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
                  <FAQQuestionRow
                    key={part + index}
                    part={part}
                    index={index}
                    question={question}
                  />
                ));
              })}
            </Fragment>
          )}
        </div>
      </FAQSearch>
    </div>
  );
}

function FAQSteps({ section }: Props) {
  switch (section) {
    case "effectifs":
      return <FAQEffectifsSteps />;
    case "indicateur1":
      return <FAQIndicateur1Steps />;
    case "indicateur2":
      return <FAQIndicateur2Steps />;
    case "indicateur3":
      return <FAQIndicateur3Steps />;
    case "indicateur4":
      return <FAQIndicateur4Steps />;
    case "indicateur5":
      return <FAQIndicateur5Steps />;
    case "resultat":
      return <FAQResultatSteps />;
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
  })
};

export default FAQSection;
