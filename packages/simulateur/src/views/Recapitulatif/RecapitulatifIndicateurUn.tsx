import { Table, TableCaption, Tbody, Td, Th, Thead, Tr } from "@chakra-ui/react"
import React, { FunctionComponent } from "react"

import { FormState, TranchesAges } from "../../globals"
import { effectifEtEcartRemuGroupCoef, effectifEtEcartRemuGroupCsp } from "../../utils/calculsEgaProIndicateurUn"

import {
  displayFractionPercentWithEmptyData,
  displayNameCategorieSocioPro,
  displayNameTranchesAges,
  displayPercent,
  displaySexeSurRepresente,
} from "../../utils/helpers"

import InfoBlock from "../../components/ds/InfoBlock"
import { TextSimulatorLink } from "../../components/SimulatorLink"
import { indicateursInfo } from "../../config"
import MessageWhenInvalid from "./components/MessageWhenInvalid"
import RecapBloc from "./components/RecapBloc"

interface RecapitulatifIndicateurUnProps {
  indicateurUnFormValidated: FormState
  effectifsIndicateurUnCalculable: boolean
  effectifEtEcartRemuParTranche: Array<effectifEtEcartRemuGroupCsp> | Array<effectifEtEcartRemuGroupCoef>
  indicateurEcartRemuneration: number | undefined
  indicateurSexeSurRepresente: "hommes" | "femmes" | undefined
  indicateurUnParCSP: boolean
  noteIndicateurUn: number | undefined
}

const RecapitulatifIndicateurUn: FunctionComponent<RecapitulatifIndicateurUnProps> = ({
  indicateurUnFormValidated,
  effectifsIndicateurUnCalculable,
  effectifEtEcartRemuParTranche,
  indicateurEcartRemuneration,
  indicateurSexeSurRepresente,
  indicateurUnParCSP,
  noteIndicateurUn,
}) => {
  if (!effectifsIndicateurUnCalculable) {
    const messageCalculParCSP = indicateurUnParCSP ? (
      ""
    ) : (
      <TextSimulatorLink to="/indicateur1" label="Vous devez calculer par CSP" />
    )
    return (
      <InfoBlock
        type="warning"
        title={indicateursInfo.indicateur1.title}
        text={`Malheureusement votre indicateur n’est pas calculable car l’ensemble des groupes valables (c’est-à-dire comptant au moins 3 femmes et 3 hommes), représentent moins de 40% des effectifs. ${messageCalculParCSP}`}
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
            name: displayNameCategorieSocioPro(el.categorieSocioPro),
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
        firstLineLabel: "votre résultat final est",
        firstLineData: indicateurEcartRemuneration !== undefined ? displayPercent(indicateurEcartRemuneration) : "--",
        firstLineInfo: displaySexeSurRepresente(indicateurSexeSurRepresente),
        secondLineLabel: "votre note obtenue est",
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
            <Th fontSize="xxs">{displayNameTranchesAges(TranchesAges.MoinsDe30ans)}</Th>
            <Th fontSize="xxs">{displayNameTranchesAges(TranchesAges.De30a39ans)}</Th>
            <Th fontSize="xxs">{displayNameTranchesAges(TranchesAges.De40a49ans)}</Th>
            <Th fontSize="xxs">{displayNameTranchesAges(TranchesAges.PlusDe50ans)}</Th>
          </Tr>
        </Thead>
        <Tbody>
          {groupEffectifEtEcartRemuParTranche.map(
            (
              effectifEtEcartRemuParTranche: Array<{
                id: any
                name: string
                ecartRemunerationMoyenne: number | undefined
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
