/** @jsx jsx */
import { css, jsx } from "@emotion/core";

import { FormState } from "../../globals.d";

import InfoBloc from "../../components/InfoBloc";
import RecapBloc from "./components/RecapBloc";

interface Props {
  indicateurUnFormValidated: FormState;
  indicateurEcartRemuneration: number | undefined;
  indicateurSexeSurRepresente: "hommes" | "femmes" | undefined;
  noteIndicateurUn: number | undefined;
}

function RecapitulatifIndicateurUn({
  indicateurUnFormValidated,
  indicateurEcartRemuneration,
  indicateurSexeSurRepresente,
  noteIndicateurUn
}: Props) {
  if (indicateurUnFormValidated !== "Valid") {
    return (
      <div css={styles.container}>
        <InfoBloc
          title="Indicateur 1, écart de rémunération entre les hommes et les femmes"
          text="Nous ne pouvons pas calculer votre indicateur car vous n’avez pas encore validé vos données saissies."
        />
      </div>
    );
  }

  return (
    <div css={styles.container}>
      <RecapBloc
        title="Indicateur 1, écart de rémunération entre les hommes et les femmes"
        resultBubble={{
          firstLineLabel: "votre résultat final est",
          firstLineData:
            (indicateurEcartRemuneration !== undefined
              ? indicateurEcartRemuneration.toFixed(1)
              : "--") + " %",
          firstLineInfo: `écart favorable aux ${indicateurSexeSurRepresente}`,
          secondLineLabel: "votre note obtenue est",
          secondLineData:
            (noteIndicateurUn !== undefined ? noteIndicateurUn : "--") + "/40",
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

export default RecapitulatifIndicateurUn;
