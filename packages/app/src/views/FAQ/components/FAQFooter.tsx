/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import globalStyles from "../../../utils/globalStyles";

import AlloEgaproBackgroundImage from "./allo_egapro.png";

function FAQFooter() {
  return (
    <div css={styles.container}>
      <div>
        <span css={styles.text}>
          Vous n’avez pas trouvé l’aide que vous cherchiez ?
        </span>
        <br />
        <span css={styles.text}>
          <a
            href="https://travail-emploi.gouv.fr/IMG/xlsx/referents_egalite_professionnelle.xlsx"
            css={styles.infoLink}
          >
            Contactez votre référent Egapro
          </a>
        </span>
        <br />
        <span css={styles.text}>
          ou appelez Allô Index Egapro
          <a
            href="tel:+33800009110"
            css={styles.alloEgapro}
            title="Allô Index Egapro : 0 800 009 110 (Service gratuit + prix appel)"
          >
            0 800 009 110
          </a>
        </span>
      </div>
    </div>
  );
}

const styles = {
  container: css({
    marginTop: "auto",
    height: 120,
    flexShrink: 0,
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    borderTop: "1px solid #EFECEF"
  }),
  text: css({
    fontSize: 12,
    lineHeight: "15px"
  }),
  infoLink: {
    color: globalStyles.colors.default,
    textDecoration: "underline",
    marginLeft: 8
  },
  alloEgapro: {
    backgroundImage: `url(${AlloEgaproBackgroundImage})`,
    backgroundSize: "contain",
    backgroundRepeat: "no-repeat",
    color: "#91919b",
    display: "inline-block",
    fontFamily: "arial",
    fontWeight: "bold" as "bold",
    fontSize: 20,
    marginLeft: 8,
    marginTop: 10,
    padding: "10px 50px 10px 13px",
    textDecoration: "none",
    width: "100%"
  }
};

export default FAQFooter;
