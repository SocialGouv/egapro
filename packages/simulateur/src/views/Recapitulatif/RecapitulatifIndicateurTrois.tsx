import React, { FunctionComponent } from "react"
import { Table, TableCaption, Tbody, Td, Tr } from "@chakra-ui/react"

import { FormState, CategorieSocioPro } from "../../globals"

import {
  displayFractionPercentWithEmptyData,
  displayNameCategorieSocioPro,
  displayPercent,
  displaySexeSurRepresente,
} from "../../utils/helpers"

import InfoBlock from "../../components/ds/InfoBlock"
import RecapBloc from "./components/RecapBloc"
import { TextSimulatorLink } from "../../components/SimulatorLink"

interface RecapitulatifIndicateurTroisProps {
  indicateurTroisFormValidated: FormState
  effectifsIndicateurTroisCalculable: boolean
  indicateurTroisCalculable: boolean
  effectifEtEcartPromoParGroupe: Array<{
    categorieSocioPro: CategorieSocioPro
    ecartTauxPromotion: number | undefined
  }>
  indicateurEcartPromotion: number | undefined
  indicateurSexeSurRepresente: "hommes" | "femmes" | undefined
  noteIndicateurTrois: number | undefined
  correctionMeasure: boolean
}

const RecapitulatifIndicateurTrois: FunctionComponent<RecapitulatifIndicateurTroisProps> = ({
  indicateurTroisFormValidated,
  effectifsIndicateurTroisCalculable,
  indicateurTroisCalculable,
  effectifEtEcartPromoParGroupe,
  indicateurEcartPromotion,
  indicateurSexeSurRepresente,
  noteIndicateurTrois,
  correctionMeasure,
}) => {
  if (indicateurTroisFormValidated !== "Valid") {
    return (
      <InfoBlock
        type="warning"
        title="Indicateur écart de taux de promotions entre les femmes et les hommes"
        text={
          <>
            Nous ne pouvons pas calculer votre indicateur car vous n’avez pas encore validé vos données saisies.{" "}
            <TextSimulatorLink to="/indicateur3" label="valider les données" />
          </>
        }
      />
    )
  }

  if (!effectifsIndicateurTroisCalculable) {
    return (
      <InfoBlock
        type="warning"
        title="Indicateur écart de taux de promotions entre les femmes et les hommes"
        text="Malheureusement votre indicateur n’est pas calculable car l’ensemble des groupes valables (c’est-à-dire comptant au moins 10 femmes et 10 hommes), représentent moins de 40% des effectifs."
      />
    )
  }

  if (!indicateurTroisCalculable) {
    return (
      <InfoBlock
        type="warning"
        title="Indicateur écart de taux de promotions entre les femmes et les hommes"
        text="Malheureusement votre indicateur n’est pas calculable car il n’y a pas eu de promotion durant la période de référence"
      />
    )
  }

  return (
    <RecapBloc
      title="Indicateur écart de taux de promotions entre les femmes et les hommes"
      resultSummary={{
        firstLineLabel: "votre résultat final est",
        firstLineData: indicateurEcartPromotion !== undefined ? displayPercent(indicateurEcartPromotion) : "--",
        firstLineInfo: displaySexeSurRepresente(indicateurSexeSurRepresente),
        secondLineLabel: "votre note obtenue est",
        secondLineData: (noteIndicateurTrois !== undefined ? noteIndicateurTrois : "--") + "/15",
        secondLineInfo: correctionMeasure ? "** mesures de correction prises en compte" : undefined,
        indicateurSexeSurRepresente,
      }}
    >
      <Table size="sm" variant="striped">
        <TableCaption>écart de taux d’augmentations par csp</TableCaption>
        <Tbody>
          {effectifEtEcartPromoParGroupe.map(({ categorieSocioPro, ecartTauxPromotion }) => (
            <Tr key={categorieSocioPro}>
              <Td>{displayNameCategorieSocioPro(categorieSocioPro)}</Td>
              <Td isNumeric>{displayFractionPercentWithEmptyData(ecartTauxPromotion, 1)}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </RecapBloc>
  )
}

export default RecapitulatifIndicateurTrois
