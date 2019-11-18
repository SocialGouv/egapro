/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import globalStyles from "../../../utils/globalStyles";

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
            Contactez votre référent égapro
          </a>
        </span>
      </div>
    </div>
  );
}

const styles = {
  container: css({
    marginTop: "auto",
    height: 80,
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
  }
};

export default FAQFooter;
