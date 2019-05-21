/** @jsx jsx */
import { css, jsx } from "@emotion/core";

import { FormState } from "../../globals.d";

import InfoBloc from "../../components/InfoBloc";
import RecapBloc from "./components/RecapBloc";

interface Props {
  indicateurTroisFormValidated: FormState;
  indicateurTroisCalculable: boolean;
  indicateurEcartPromotion: number | undefined;
  indicateurSexeSurRepresente: "hommes" | "femmes" | undefined;
  noteIndicateurTrois: number | undefined;
}

function RecapitulatifIndicateurTrois({
  indicateurTroisFormValidated,
  indicateurTroisCalculable,
  indicateurEcartPromotion,
  indicateurSexeSurRepresente,
  noteIndicateurTrois
}: Props) {
  if (indicateurTroisFormValidated !== "Valid") {
    return (
      <div css={styles.container}>
        <InfoBloc
          title="Indicateur 3, écart de taux de promotion entre les hommes et les femmes"
          text="Nous ne pouvons pas calculer votre indicateur car vous n’avez pas encore validé vos données saissies."
        />
      </div>
    );
  }

  if (!indicateurTroisCalculable) {
    return (
      <div css={styles.container}>
        <InfoBloc
          title="Indicateur 3, écart de taux de promotion entre les hommes et les femmes"
          text="Malheureusement votre indicateur est incalculable car il n’y a pas eu de promotion durant la période de référence"
        />
      </div>
    );
  }

  return (
    <div css={styles.container}>
      <RecapBloc
        title="Indicateur 3, écart de taux de promotion entre les hommes et les femmes"
        resultBubble={{
          firstLineLabel: "votre résultat final est",
          firstLineData:
            (indicateurEcartPromotion !== undefined
              ? indicateurEcartPromotion.toFixed(1)
              : "--") + " %",
          firstLineInfo: `écart favorable aux ${indicateurSexeSurRepresente}`,
          secondLineLabel: "votre note obtenue est",
          secondLineData:
            (noteIndicateurTrois !== undefined ? noteIndicateurTrois : "--") +
            "/15",
          secondLineInfo: "mesures de correction prises en compte"
        }}
      >
        <div />
      </RecapBloc>
    </div>
  );
}

const styles = {
  container: css({
    display: "flex",
    flexDirection: "column",
    marginTop: 22,
    marginBottom: 22
  })
};

export default RecapitulatifIndicateurTrois;
