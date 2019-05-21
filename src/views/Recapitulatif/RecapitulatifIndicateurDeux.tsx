/** @jsx jsx */
import { css, jsx } from "@emotion/core";

import { FormState } from "../../globals.d";

import InfoBloc from "../../components/InfoBloc";
import RecapBloc from "./components/RecapBloc";

interface Props {
  indicateurDeuxFormValidated: FormState;
  indicateurDeuxCalculable: boolean;
  indicateurEcartAugmentation: number | undefined;
  indicateurSexeSurRepresente: "hommes" | "femmes" | undefined;
  noteIndicateurDeux: number | undefined;
}

function RecapitulatifIndicateurDeux({
  indicateurDeuxFormValidated,
  indicateurDeuxCalculable,
  indicateurEcartAugmentation,
  indicateurSexeSurRepresente,
  noteIndicateurDeux
}: Props) {
  if (indicateurDeuxFormValidated !== "Valid") {
    return (
      <div css={styles.container}>
        <InfoBloc
          title="Indicateur 2, écart de taux d’augmentation entre les hommes et les femmes"
          text="Nous ne pouvons pas calculer votre indicateur car vous n’avez pas encore validé vos données saissies."
        />
      </div>
    );
  }

  if (!indicateurDeuxCalculable) {
    return (
      <div css={styles.container}>
        <InfoBloc
          title="Indicateur 2, écart de taux d’augmentation entre les hommes et les femmes"
          text="Malheureusement votre indicateur est incalculable car il n’y a pas eu d’augmentation durant la période de référence"
        />
      </div>
    );
  }

  return (
    <div css={styles.container}>
      <RecapBloc
        title="Indicateur 2, écart de taux d’augmentation entre les hommes et les femmes"
        resultBubble={{
          firstLineLabel: "votre résultat final est",
          firstLineData:
            (indicateurEcartAugmentation !== undefined
              ? indicateurEcartAugmentation.toFixed(1)
              : "--") + " %",
          firstLineInfo: `écart favorable aux ${indicateurSexeSurRepresente}`,
          secondLineLabel: "votre note obtenue est",
          secondLineData:
            (noteIndicateurDeux !== undefined ? noteIndicateurDeux : "--") +
            "/20",
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

export default RecapitulatifIndicateurDeux;
