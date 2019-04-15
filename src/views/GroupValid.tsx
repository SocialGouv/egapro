/** @jsx jsx */
import { css, jsx } from "@emotion/core";

import { CategorieSocioPro } from "../globals.d";

import LinkButton from "../components/LinkButton";

interface Props {
  nombreGroupes: number;
  nombreGroupesValides: number;
  nombreSalariesTotal: number;
  nombreSalariesGroupesValides: number;
  indicateurCalculable: boolean;
}

function GroupValid({
  nombreGroupes,
  nombreGroupesValides,
  nombreSalariesTotal,
  nombreSalariesGroupesValides,
  indicateurCalculable
}: Props) {
  const onClick = () => {};

  const messageGroupe1 =
    nombreGroupesValides > 1
      ? `${nombreGroupesValides} groupes sont valides`
      : nombreGroupesValides === 1
      ? "Un groupe est valide"
      : "Aucun groupe n'est valide";

  const messageGroupe2 =
    nombreGroupes > 1
      ? ` sur un total de ${nombreGroupes} groupes.`
      : ` sur un total de ${nombreGroupes} groupe.`;

  return (
    <div>
      <div css={styles.bloc}>
        <p css={styles.blocTitle}>
          {indicateurCalculable
            ? "Indicateur Calculable"
            : "Indicateur Non Calculable"}
        </p>

        <div css={styles.message}>
          <p>{messageGroupe1 + messageGroupe2}</p>
        </div>

        <div css={styles.message}>
          <p>
            Les groupes valident{" "}
            {indicateurCalculable ? "représentent" : "ne réprésentent pas"} un
            effectif supérieur ou égal à 40%.
          </p>
        </div>

        <LinkButton
          to={`/indicateur1/${CategorieSocioPro.Ouvriers}`}
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

export default GroupValid;
