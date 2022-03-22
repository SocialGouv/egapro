/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react"

import { FormState } from "../../globals"

import ResultBubble from "../../components/ResultBubble"
import ActionLink from "../../components/ActionLink"

interface Props {
  indicateurSexeSousRepresente: "hommes" | "femmes" | "egalite" | undefined
  indicateurNombreSalariesSexeSousRepresente: number | undefined
  noteIndicateurCinq: number | undefined
  validateIndicateurCinq: (valid: FormState) => void
}

function IndicateurCinqResult({
  indicateurSexeSousRepresente,
  indicateurNombreSalariesSexeSousRepresente,
  noteIndicateurCinq,
  validateIndicateurCinq,
}: Props) {
  const firstLineInfo =
    indicateurSexeSousRepresente === undefined
      ? undefined
      : indicateurSexeSousRepresente === "egalite"
      ? "les femmes et les hommes sont à égalité"
      : indicateurSexeSousRepresente === "hommes"
      ? "les femmes sont sur-représentées"
      : "les hommes sont sur-représentés"
  return (
    <div css={styles.container}>
      <ResultBubble
        firstLineLabel="votre résultat final est"
        firstLineData={
          indicateurNombreSalariesSexeSousRepresente !== undefined
            ? String(indicateurNombreSalariesSexeSousRepresente)
            : "--"
        }
        firstLineInfo={firstLineInfo}
        secondLineLabel="votre note obtenue est"
        secondLineData={(noteIndicateurCinq !== undefined ? noteIndicateurCinq : "--") + "/10"}
        indicateurSexeSurRepresente={
          indicateurSexeSousRepresente === undefined || indicateurSexeSousRepresente === "egalite"
            ? undefined
            : indicateurSexeSousRepresente === "hommes"
            ? "femmes"
            : "hommes"
        }
      />

      <p css={styles.edit}>
        <ActionLink onClick={() => validateIndicateurCinq("None")}>modifier les données saisies</ActionLink>
      </p>
    </div>
  )
}

const styles = {
  container: css({
    maxWidth: 250,
    marginTop: 64,
  }),
  edit: css({
    marginTop: 14,
    marginBottom: 14,
    textAlign: "center",
  }),
}

export default IndicateurCinqResult
