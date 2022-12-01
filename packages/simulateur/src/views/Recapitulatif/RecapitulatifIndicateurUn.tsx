import React, { FunctionComponent } from "react"
import { Table, TableCaption, Tbody, Td, Text, Th, Thead, Tr } from "@chakra-ui/react"

import { FormState, TranchesAges } from "../../globals"
import { effectifEtEcartRemuGroupCsp, effectifEtEcartRemuGroupCoef } from "../../utils/calculsEgaProIndicateurUn"

import {
  displayNameTranchesAges,
  displayNameCategorieSocioPro,
  displayPercent,
  displaySexeSurRepresente,
} from "../../utils/helpers"

import InfoBlock from "../../components/ds/InfoBlock"
import RecapBloc from "./components/RecapBloc"
import { TextSimulatorLink } from "../../components/SimulatorLink"

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
  if (indicateurUnFormValidated !== "Valid") {
    return (
      <InfoBlock
        type="warning"
        title="Indicateur écart de rémunération entre les femmes et les hommes"
        text={
          <>
            <Text>
              L’indicateur ne peut être calculé car vous n’avez pas validé les informations nécessaires à son calcul.
            </Text>
            <Text mt={1}>
              <TextSimulatorLink to="/indicateur1" label="Valider les informations" />
            </Text>
          </>
        }
      />
    )
  }

  if (!effectifsIndicateurUnCalculable) {
    const messageCalculParCSP = indicateurUnParCSP ? (
      ""
    ) : (
      <TextSimulatorLink to="/indicateur1" label="Vous devez calculer par CSP" />
    )
    return (
      <InfoBlock
        type="warning"
        title="Indicateur écart de rémunération entre les femmes et les hommes"
        text={`Malheureusement votre indicateur n’est pas calculable car l’ensemble des groupes valables (c’est-à-dire comptant au moins 3 femmes et 3 hommes), représentent moins de 40% des effectifs. ${messageCalculParCSP}`}
      />
    )
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
      title="Indicateur écart de rémunération entre les femmes et les hommes"
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
                  {effectifEtEcartRemuParTranche[0].ecartRemunerationMoyenne
                    ? displayPercent(effectifEtEcartRemuParTranche[0].ecartRemunerationMoyenne * 100)
                    : ""}
                </Td>
                <Td isNumeric>
                  {effectifEtEcartRemuParTranche[1].ecartRemunerationMoyenne
                    ? displayPercent(effectifEtEcartRemuParTranche[1].ecartRemunerationMoyenne * 100)
                    : ""}
                </Td>
                <Td isNumeric>
                  {effectifEtEcartRemuParTranche[2].ecartRemunerationMoyenne
                    ? displayPercent(effectifEtEcartRemuParTranche[2].ecartRemunerationMoyenne * 100)
                    : ""}
                </Td>
                <Td isNumeric>
                  {effectifEtEcartRemuParTranche[3].ecartRemunerationMoyenne
                    ? displayPercent(effectifEtEcartRemuParTranche[3].ecartRemunerationMoyenne * 100)
                    : ""}
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
