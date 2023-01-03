import React, { FunctionComponent } from "react"
import { Text } from "@chakra-ui/react"

import InfoBlock from "../../components/ds/InfoBlock"

interface RecapitulatifIndexProps {
  allIndicateurValid: boolean
  noteIndex: number | undefined
  totalPoint: number
  totalPointCalculable: number
  anneeDeclaration: number
}

const RecapitulatifIndex: FunctionComponent<RecapitulatifIndexProps> = ({
  allIndicateurValid,
  noteIndex,
  totalPoint,
  totalPointCalculable,
  anneeDeclaration,
}) => (
  <>
    {allIndicateurValid ? (
      noteIndex !== undefined ? (
        <InfoBlock
          type="success"
          title="Index égalité femmes-hommes"
          text={
            <>
              <Text>
                Votre résultat total est <strong>{noteIndex}/100</strong>.
              </Text>
              <Text
                mt={1}
                fontStyle="italic"
                fontSize="xs"
              >{`${totalPoint} points sur un maximum de ${totalPointCalculable} pouvant être obtenus.`}</Text>
            </>
          }
        />
      ) : (
        <InfoBlock
          type="warning"
          title={`Index égalité femmes-hommes en ${anneeDeclaration + 1} (au titre des données ${anneeDeclaration})`}
          text={
            <>
              <Text>
                Vos indicateurs calculables représentent moins de 75 points, votre Index ne peut être calculé.
              </Text>
              <Text
                mt={1}
                fontStyle="italic"
                fontSize="xs"
              >{`${totalPoint} points sur un maximum de ${totalPointCalculable} pouvant être obtenus.`}</Text>
            </>
          }
        />
      )
    ) : (
      <InfoBlock
        type="warning"
        title="Index égalité femmes-hommes"
        text="Vous n’avez pas encore validé tous vos indicateurs, votre index ne peut être calculé."
      />
    )}
  </>
)

export default RecapitulatifIndex
