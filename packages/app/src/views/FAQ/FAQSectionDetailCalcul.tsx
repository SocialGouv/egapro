/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { Link } from "react-router-dom";

import { FAQSectionType } from "../../globals.d";
import globalStyles from "../../utils/globalStyles";

import FAQTitle from "./components/FAQTitle";
import FAQTitle2 from "./components/FAQTitle2";

import FAQIndicateur1DetailCalcul from "./components-detail-calcul/FAQIndicateur1DetailCalcul";
// import FAQIndicateur2DetailCalcul from "./components-detail-calcul/FAQIndicateur2DetailCalcul";
// import FAQIndicateur3DetailCalcul from "./components-detail-calcul/FAQIndicateur3DetailCalcul";
// import FAQIndicateur4DetailCalcul from "./components-detail-calcul/FAQIndicateur4DetailCalcul";
// import FAQIndicateur5DetailCalcul from "./components-detail-calcul/FAQIndicateur5DetailCalcul";
// import FAQResultatDetailCalcul from "./components-detail-calcul/FAQResultatDetailCalcul";

import { faqSections } from "../../data/faq";

interface Props {
  section: FAQSectionType;
}

function FAQSectionDetailCalcul({ section }: Props) {
  const faqSection = faqSections[section];

  const FAQDetailCalculElement = FAQDetailCalcul({ section });

  return (
    <div css={styles.container}>
      <FAQTitle>{faqSection.title}</FAQTitle>

      <div css={styles.content}>
        {FAQDetailCalculElement && (
          <div css={styles.pasapas}>
            <FAQTitle2>
              Comprendre comment est calculé{" "}
              {section === "resultat" ? "l'index" : "l'indicateur"}
            </FAQTitle2>

            {FAQDetailCalculElement}
          </div>
        )}

        <Link
          to={{ state: { faq: `/section/${section}` } }}
          css={styles.button}
        >
          <span css={styles.buttonIcon}>◀</span> ︎retour
        </Link>
      </div>
    </div>
  );
}

function FAQDetailCalcul({ section }: Props) {
  switch (section) {
    case "indicateur1":
      return <FAQIndicateur1DetailCalcul />;
    // case "indicateur2":
    //   return <FAQIndicateur2DetailCalcul />;
    // case "indicateur3":
    //   return <FAQIndicateur3DetailCalcul />;
    // case "indicateur4":
    //   return <FAQIndicateur4DetailCalcul />;
    // case "indicateur5":
    //   return <FAQIndicateur5DetailCalcul />;
    // case "resultat":
    //   return <FAQResultatDetailCalcul />;
    default:
      return null;
  }
}

const styles = {
  container: css({}),
  content: css({
    marginTop: 28,
    marginBottom: 14
  }),
  pasapas: css({
    marginBottom: 28
  }),

  button: css({
    color: globalStyles.colors.default,
    fontSize: 12,
    textDecoration: "none"
  }),
  buttonIcon: css({
    fontSize: 8,
    fontFamily: "Segoe UI Symbol" // fix Edge
  })
};

export default FAQSectionDetailCalcul;
