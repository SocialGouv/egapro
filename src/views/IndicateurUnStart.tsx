/** @jsx jsx */
import { css, jsx } from "@emotion/core";

import { CategorieSocioPro } from "../globals.d";

import ButtonLink from "../components/ButtonLink";

import { displayPercent } from "../utils/helpers";

interface Props {
  nombreSalariesTotal: number;
  nombreSalariesGroupesValides: number;
  indicateurCalculable: boolean;
}

function IndicateurUnStart({
  nombreSalariesTotal,
  nombreSalariesGroupesValides,
  indicateurCalculable
}: Props) {
  const pourcentageEffectifsValides =
    nombreSalariesTotal > 0
      ? nombreSalariesGroupesValides / nombreSalariesTotal
      : 0;

  return (
    <div>
      <div css={styles.bloc}>
        <p css={styles.blocTitle}>
          Indicateur 1 {indicateurCalculable ? "Calculable" : "Non Calculable"}
        </p>

        <div css={styles.message}>
          <p>
            Les groupes valident représentent{" "}
            {displayPercent(pourcentageEffectifsValides, 0)}
          </p>
        </div>

        <div css={styles.message}>
          <p>
            Donc les groupes valident{" "}
            {indicateurCalculable ? "représentent" : "ne réprésentent pas"} un
            effectif supérieur ou égal à 40%.
          </p>
        </div>

        <ButtonLink
          to={`/indicateur1/categorieSocioPro/${CategorieSocioPro.Ouvriers}`}
          label="Continuer"
        />
      </div>
    </div>
  );
}

const styles = {
  bloc: css({
    display: "flex",
    flexDirection: "column",
    maxWidth: 800,
    padding: "12px 24px",
    margin: "24px auto",
    backgroundColor: "white",
    borderRadius: 6,
    boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.12)"
  }),
  blocTitle: css({
    fontSize: 24,
    paddingTop: 6,
    paddingBottom: 24,
    color: "#353535",
    textAlign: "center"
  }),
  message: css({
    fontSize: 26,
    fontWeight: 200,
    textAlign: "center",
    marginBottom: 32,
    marginTop: 12
  })
};

export default IndicateurUnStart;
