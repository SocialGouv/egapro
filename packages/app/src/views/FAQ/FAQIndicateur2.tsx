/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { Link } from "react-router-dom";

import { FAQSectionType } from "../../globals.d";

import globalStyles from "../../utils/globalStyles";

import { IconLamp } from "../../components/Icons";

import FAQSearchBox from "./components/FAQSearchBox";
import FAQTitle from "./components/FAQTitle";
import FAQTitle2 from "./components/FAQTitle2";
import FAQStep from "./components/FAQStep";

import faqData from "../../data/faq";

interface Props {
  section: FAQSectionType;
}

function FAQIndicateur2({ section }: Props) {
  const faqSection = faqData[section];

  return (
    <div css={styles.container}>
      <FAQTitle>
        indicateur 2<br />
        écart d’augmentation
      </FAQTitle>

      <FAQSearchBox />

      <div css={styles.content}>
        <div css={styles.pasapas}>
          <FAQTitle2>L’essentiel</FAQTitle2>

          <FAQStep icon={<IconLamp />}>
            La notion d'
            <strong>
              augmentation individuelle correspond à une augmentation
              individuelle du salaire de base du salarié concerné
            </strong>
          </FAQStep>

          <FAQStep icon={<IconLamp />}>
            Les groupes ne comportant pas{" "}
            <strong>au moins 10 hommes et 10 femmes</strong> ne sont pas retenus
            pour le calcul
          </FAQStep>

          <FAQStep icon={<IconLamp />}>
            Si le total des effectifs pouvant être pris en compte est inférieur
            à 40% des effectifs totaux, l’indicateur n’est pas calculable
          </FAQStep>
        </div>

        <FAQTitle2>Les questions récurrentes</FAQTitle2>
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

export default FAQIndicateur2;
