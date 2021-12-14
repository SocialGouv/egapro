import React, { FunctionComponent } from "react"
import { Text } from "@chakra-ui/react"

import InfoBloc from "../../components/InfoBloc"

interface RecapitulatifIndexProps {
  allIndicateurValid: boolean
  noteIndex: number | undefined
  totalPoint: number
  totalPointCalculable: number
}

const RecapitulatifIndex: FunctionComponent<RecapitulatifIndexProps> = ({
  allIndicateurValid,
  noteIndex,
  totalPoint,
  totalPointCalculable,
}) => (
  <React.Fragment>
    {allIndicateurValid ? (
      noteIndex !== undefined ? (
        <InfoBloc
          type="success"
          title="Index égalité femmes-hommes"
          text={
            <React.Fragment>
              <Text>{`Votre résultat total est <strong>${noteIndex}/100</strong>.`}</Text>
              <Text
                mt={1}
                fontStyle="italic"
                fontSize="xs"
              >{`${totalPoint} points sur un maximum de ${totalPointCalculable} pouvant être obtenus.`}</Text>
            </React.Fragment>
          }
        />
      ) : (
        <InfoBloc
          type="warning"
          title="Index égalité femmes-hommes"
          text={
            <React.Fragment>
              <Text>
                Vos indicateurs calculables représentent moins de 75 points, votre Index ne peut être calculé.
              </Text>
              <Text
                mt={1}
                fontStyle="italic"
                fontSize="xs"
              >{`${totalPoint} points sur un maximum de ${totalPointCalculable} pouvant être obtenus.`}</Text>
            </React.Fragment>
          }
        />
      )
    ) : (
      <InfoBloc
        type="warning"
        title="Index égalité femmes-hommes"
        text="Vous n’avez pas encore validé tous vos indicateurs, votre index ne peut être calculé."
      />
    )}
  </React.Fragment>
)

export default RecapitulatifIndex
