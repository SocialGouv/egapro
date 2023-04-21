import { Table, TableCaption, Tbody, Td, Th, Thead, Tr } from "@chakra-ui/react"
import React, { FunctionComponent } from "react"

import { TrancheAge } from "../../globals"
import calculerIndicateurUn from "../../utils/calculsEgaProIndicateurUn"

import {
  displayFractionPercentWithEmptyData,
  displayNameCSP,
  displayNameTranchesAges,
  displayPercent,
  displaySexeSurRepresente,
} from "../../utils/helpers"

import InfoBlock from "../../components/ds/InfoBlock"
import { indicateursInfo } from "../../config"
import { useAppStateContextProvider } from "../../hooks/useAppStateContextProvider"
import { isFormValid } from "../../utils/formHelpers"
import MessageWhenInvalid from "./components/MessageWhenInvalid"
import RecapBloc from "./components/RecapBloc"

interface RecapitulatifIndicateurUnProps {
  calculsIndicateurUn: ReturnType<typeof calculerIndicateurUn>
}

const RecapitulatifIndicateurUn: FunctionComponent<RecapitulatifIndicateurUnProps> = ({ calculsIndicateurUn }) => {
  const { state } = useAppStateContextProvider()

  if (!state) return null

  const indicateurUnFormValidated = state.indicateurUn.formValidated
  const indicateurUnParCSP = state.indicateurUn.modaliteCalcul === "csp"
  const isEffectifsFilled = isFormValid(state.effectif)

  const {
    effectifsIndicateurCalculable: effectifsIndicateurUnCalculable,
    effectifEtEcartRemuParTranche,
    indicateurEcartRemuneration,
    indicateurSexeSurRepresente,
    noteIndicateurUn,
  } = calculsIndicateurUn

  if (!isEffectifsFilled) {
    return <MessageWhenInvalid indicateur="indicateur1" />
  }

  if (!effectifsIndicateurUnCalculable) {
    return (
      <InfoBlock
        type="warning"
        title={indicateursInfo.indicateur1.title}
        text={`Malheureusement votre indicateur n’est pas calculable car l’ensemble des groupes valables (c’est-à-dire comptant au moins 3 femmes et 3 hommes), représentent moins de 40% des effectifs.`}
      />
    )
  }

  if (indicateurUnFormValidated === "None") {
    return <MessageWhenInvalid indicateur="indicateur1" />
  }

  // @ts-ignore
  const groupEffectifEtEcartRemuParTranche = effectifEtEcartRemuParTranche.reduce((acc, el, index) => {
    const newEl =
      el.categorieSocioPro !== undefined
        ? {
            id: el.categorieSocioPro,
            name: displayNameCSP(el.categorieSocioPro),
            ...el,
          }
        : el
    if (index % 4 === 0) {
      acc.push([newEl])
    } else {
      acc[acc.length - 1].push(newEl)
    }
    return acc
  }, [])

  return (
    <RecapBloc
      indicateur="indicateur1"
      resultSummary={{
        firstLineLabel: "Votre résultat final est",
        firstLineData: indicateurEcartRemuneration !== undefined ? displayPercent(indicateurEcartRemuneration) : "--",
        firstLineInfo: displaySexeSurRepresente(indicateurSexeSurRepresente),
        secondLineLabel: "Votre note obtenue est",
        secondLineData: (noteIndicateurUn !== undefined ? noteIndicateurUn : "--") + "/40",
        indicateurSexeSurRepresente,
      }}
    >
      <Table size="sm" variant="striped">
        <TableCaption>
          <>
            écart de rémunération par {indicateurUnParCSP ? "csp" : "niveau ou coefficient hiérarchique"}
            <br />
            (avant seuil de pertinence)
          </>
        </TableCaption>
        <Thead textTransform="inherit" fontSize=".5rem">
          <Tr>
            <Th />
            <Th fontSize="xxs">{displayNameTranchesAges(TrancheAge.MoinsDe30ans)}</Th>
            <Th fontSize="xxs">{displayNameTranchesAges(TrancheAge.De30a39ans)}</Th>
            <Th fontSize="xxs">{displayNameTranchesAges(TrancheAge.De40a49ans)}</Th>
            <Th fontSize="xxs">{displayNameTranchesAges(TrancheAge.PlusDe50ans)}</Th>
          </Tr>
        </Thead>
        <Tbody>
          {groupEffectifEtEcartRemuParTranche.map(
            (
              effectifEtEcartRemuParTranche: Array<{
                id: any
                name: string
                ecartRemunerationMoyenne?: number
              }>,
            ) => (
              <Tr key={effectifEtEcartRemuParTranche[0].id}>
                <Td>{effectifEtEcartRemuParTranche[0].name}</Td>
                <Td isNumeric>
                  {displayFractionPercentWithEmptyData(effectifEtEcartRemuParTranche[0].ecartRemunerationMoyenne)}
                </Td>
                <Td isNumeric>
                  {displayFractionPercentWithEmptyData(effectifEtEcartRemuParTranche[1].ecartRemunerationMoyenne)}
                </Td>
                <Td isNumeric>
                  {displayFractionPercentWithEmptyData(effectifEtEcartRemuParTranche[2].ecartRemunerationMoyenne)}
                </Td>
                <Td isNumeric>
                  {displayFractionPercentWithEmptyData(effectifEtEcartRemuParTranche[3].ecartRemunerationMoyenne)}
                </Td>
              </Tr>
            ),
          )}
        </Tbody>
      </Table>
    </RecapBloc>
  )
}

export default RecapitulatifIndicateurUn
