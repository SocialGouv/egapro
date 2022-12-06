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

interface RecapitulatifIndicateurDeuxProps {
  indicateurDeuxFormValidated: FormState
  effectifsIndicateurDeuxCalculable: boolean
  indicateurDeuxCalculable: boolean
  effectifEtEcartAugmentParGroupe: Array<{
    categorieSocioPro: CategorieSocioPro
    ecartTauxAugmentation: number | undefined
  }>
  indicateurEcartAugmentation: number | undefined
  indicateurSexeSurRepresente: "hommes" | "femmes" | undefined
  noteIndicateurDeux: number | undefined
  correctionMeasure: boolean
}

const RecapitulatifIndicateurDeux: FunctionComponent<RecapitulatifIndicateurDeuxProps> = ({
  indicateurDeuxFormValidated,
  effectifsIndicateurDeuxCalculable,
  indicateurDeuxCalculable,
  effectifEtEcartAugmentParGroupe,
  indicateurEcartAugmentation,
  indicateurSexeSurRepresente,
  noteIndicateurDeux,
  correctionMeasure,
}) => {
  if (indicateurDeuxFormValidated !== "Valid") {
    return (
      <InfoBlock
        type="warning"
        title="Indicateur écart de taux d’augmentations entre les femmes et les hommes"
        text={
          <>
            L’indicateur ne peut être calculé car vous n’avez pas validé les informations nécessaires à son calcul.{" "}
            <TextSimulatorLink to="/indicateur2" label="Valider les informations" />
          </>
        }
      />
    )
  }

  if (!effectifsIndicateurDeuxCalculable) {
    return (
      <InfoBlock
        type="warning"
        title="Indicateur écart de taux d’augmentations entre les femmes et les hommes"
        text="Malheureusement votre indicateur n’est pas calculable car l’ensemble des groupes valables (c’est-à-dire comptant au moins 10 femmes et 10 hommes), représentent moins de 40% des effectifs."
      />
    )
  }

  if (!indicateurDeuxCalculable) {
    return (
      <InfoBlock
        type="warning"
        title="Indicateur écart de taux d’augmentations entre les femmes et les hommes"
        text="Malheureusement votre indicateur n’est pas calculable car il n’y a pas eu d’augmentation durant la période de référence"
      />
    )
  }

  return (
    <RecapBloc
      title="Indicateur écart de taux d’augmentations entre les femmes et les hommes"
      resultSummary={{
        firstLineLabel: "votre résultat final est",
        firstLineData: indicateurEcartAugmentation !== undefined ? displayPercent(indicateurEcartAugmentation) : "--",
        firstLineInfo: displaySexeSurRepresente(indicateurSexeSurRepresente),
        secondLineLabel: "votre note obtenue est",
        secondLineData: (noteIndicateurDeux !== undefined ? noteIndicateurDeux : "--") + "/20",
        secondLineInfo: correctionMeasure ? "** mesures de correction prises en compte" : undefined,
        indicateurSexeSurRepresente,
      }}
    >
      <Table size="sm" variant="striped">
        <TableCaption>écart de taux d’augmentations par csp</TableCaption>
        <Tbody>
          {effectifEtEcartAugmentParGroupe.map(({ categorieSocioPro, ecartTauxAugmentation }) => (
            <Tr key={categorieSocioPro}>
              <Td>{displayNameCategorieSocioPro(categorieSocioPro)}</Td>
              <Td isNumeric>{displayFractionPercentWithEmptyData(ecartTauxAugmentation, 1)}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </RecapBloc>
  )
}

export default RecapitulatifIndicateurDeux
