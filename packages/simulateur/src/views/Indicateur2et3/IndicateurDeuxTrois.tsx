import { Text, VStack } from "@chakra-ui/react"
import React, { FunctionComponent, PropsWithChildren } from "react"

import calculerIndicateurDeuxTrois, {
  calculBarem,
  calculPlusPetitNombreSalaries,
} from "../../utils/calculsEgaProIndicateurDeuxTrois"
import { displayPercent, messageEcartNombreEquivalentSalaries, messageMesureCorrection } from "../../utils/helpers"
import { useTitle } from "../../utils/hooks"
import totalNombreSalaries from "../../utils/totalNombreSalaries"

import ActionBar from "../../components/ActionBar"
import ActionLink from "../../components/ActionLink"
import InfoBlock from "../../components/ds/InfoBlock"
import LayoutFormAndResult from "../../components/LayoutFormAndResult"
import { ButtonSimulatorLink, TextSimulatorLink } from "../../components/SimulatorLink"

import SimulateurPage from "../../components/SimulateurPage"
import { useAppStateContextProvider } from "../../hooks/useAppStateContextProvider"
import { isFormValid } from "../../utils/formHelpers"
import IndicateurDeuxTroisForm from "./IndicateurDeuxTroisForm"
import IndicateurDeuxTroisResult from "./IndicateurDeuxTroisResult"
import { frozenDeclarationMessage } from "../../components/MessageForFrozenDeclaration"
import { isFrozenDeclaration } from "../../utils/isFrozenDeclaration"

const title = "Indicateur écart de taux d'augmentation"

const IndicateurDeuxTrois: FunctionComponent = () => {
  useTitle(title)

  const { state, dispatch } = useAppStateContextProvider()

  if (!state) return null

  const calculsIndicateurDeuxTrois = calculerIndicateurDeuxTrois(state)

  const frozenDeclaration = isFrozenDeclaration(state)

  const {
    effectifsIndicateurCalculable,
    indicateurEcartAugmentationPromotion,
    indicateurEcartNombreEquivalentSalaries,
  } = calculsIndicateurDeuxTrois

  const readOnly = isFormValid(state.indicateurDeuxTrois)

  // le formulaire d'informations n'est pas validé
  if (!isFormValid(state.informations)) {
    return (
      <PageIndicateurDeuxTrois>
        <InfoBlock
          type="warning"
          title="Vous devez renseignez vos informations d'entreprise avant d'avoir accès à cet indicateur"
          text={<TextSimulatorLink to="/informations" label="Renseigner les informations" />}
        />
      </PageIndicateurDeuxTrois>
    )
  }

  // le formulaire d'effectif n'est pas validé
  if (!isFormValid(state.effectif)) {
    return (
      <PageIndicateurDeuxTrois>
        <InfoBlock
          type="warning"
          title="Vous devez valider les effectifs pris en compte pour le calcul avant d’accéder à cet indicateur."
          text={<TextSimulatorLink to="/effectifs" label="Valider les effectifs" />}
        />
      </PageIndicateurDeuxTrois>
    )
  }

  // les effectifs ne permettent pas de calculer l'indicateur
  if (!effectifsIndicateurCalculable) {
    return (
      <PageIndicateurDeuxTrois>
        <InfoBlock
          type="warning"
          title="Malheureusement votre indicateur n'est pas calculable"
          text="Les effectifs comprennent moins de 5 femmes ou moins de 5 hommes."
        />
        <ActionBar>
          <ButtonSimulatorLink to="/indicateur4" label="Suivant" />
        </ActionBar>
      </PageIndicateurDeuxTrois>
    )
  }

  // formulaire indicateur validé mais données renseignées ne permettent pas de calculer l'indicateur
  if (readOnly && !state.indicateurDeuxTrois.presenceAugmentationPromotion) {
    return (
      <PageIndicateurDeuxTrois>
        <InfoBlock
          type="warning"
          title="Malheureusement votre indicateur n'est pas calculable"
          text="Il n'y a pas eu d'augmentation durant la période de référence."
        />
        <ActionBar>
          <ActionLink
            onClick={() => dispatch({ type: "validateIndicateurDeuxTrois", valid: "None" })}
            disabled={frozenDeclaration}
            title={frozenDeclaration ? frozenDeclarationMessage : ""}
          >
            Modifier les données saisies
          </ActionLink>
        </ActionBar>
        <ActionBar>
          <ButtonSimulatorLink to="/indicateur4" label="Suivant" />
        </ActionBar>
      </PageIndicateurDeuxTrois>
    )
  }

  const results = calculerResultats(indicateurEcartAugmentationPromotion, indicateurEcartNombreEquivalentSalaries)

  return (
    <PageIndicateurDeuxTrois>
      <LayoutFormAndResult
        form={
          <>
            <IndicateurDeuxTroisForm readOnly={readOnly} />
            {readOnly && <AdditionalInfo results={results} calculsIndicateurDeuxTrois={calculsIndicateurDeuxTrois} />}
          </>
        }
        result={
          readOnly && (
            <IndicateurDeuxTroisResult results={results} calculsIndicateurDeuxTrois={calculsIndicateurDeuxTrois} />
          )
        }
      />
    </PageIndicateurDeuxTrois>
  )
}

const PageIndicateurDeuxTrois = ({ children }: PropsWithChildren) => (
  <SimulateurPage
    title={title}
    tagline="Le nombre de femmes et d'hommes ayant été augmentés durant la période de référence, ou pendant les deux ou trois dernières années."
  >
    {children}
  </SimulateurPage>
)

export type Result = { label: string; result: string; note: number }
export type Results = { best: Result; worst: Result }

export const calculerResultats = (
  indicateurEcartAugmentationPromotion: number | undefined,
  indicateurEcartNombreEquivalentSalaries: number | undefined,
): Results => {
  const ecartTaux = {
    label: "votre résultat en pourcentage est de",
    result:
      indicateurEcartAugmentationPromotion !== undefined ? displayPercent(indicateurEcartAugmentationPromotion) : "--",
    note: indicateurEcartAugmentationPromotion !== undefined ? calculBarem(indicateurEcartAugmentationPromotion) : 0,
  }
  const ecartNbSalaries = {
    label: "votre résultat en nombre équivalent de salariés* est",
    result: indicateurEcartNombreEquivalentSalaries !== undefined ? `${indicateurEcartNombreEquivalentSalaries}` : "--",
    note:
      indicateurEcartNombreEquivalentSalaries !== undefined ? calculBarem(indicateurEcartNombreEquivalentSalaries) : 0,
  }
  const results =
    indicateurEcartNombreEquivalentSalaries !== undefined &&
    indicateurEcartAugmentationPromotion !== undefined &&
    indicateurEcartNombreEquivalentSalaries < indicateurEcartAugmentationPromotion
      ? { best: ecartNbSalaries, worst: ecartTaux }
      : { worst: ecartNbSalaries, best: ecartTaux }
  return results
}

type AdditionalInfoProps = {
  results: Results
  calculsIndicateurDeuxTrois: Pick<
    ReturnType<typeof calculerIndicateurDeuxTrois>,
    "indicateurSexeSurRepresente" | "correctionMeasure"
  >
}

export function AdditionalInfo({ results, calculsIndicateurDeuxTrois }: AdditionalInfoProps) {
  const { state } = useAppStateContextProvider()

  const { indicateurSexeSurRepresente, correctionMeasure } = calculsIndicateurDeuxTrois

  if (!state) return null

  const { totalNombreSalariesHomme: totalNombreSalariesHommes, totalNombreSalariesFemme: totalNombreSalariesFemmes } =
    totalNombreSalaries(state.effectif.nombreSalaries)

  const plusPetitNombreSalaries = calculPlusPetitNombreSalaries(totalNombreSalariesHommes, totalNombreSalariesFemmes)

  return (
    <VStack spacing={4} mt={6}>
      <Text fontSize="sm" color="gray.500" fontStyle="italic">
        {results.worst.label} <strong>{results.worst.result}</strong>, la note obtenue{" "}
        {correctionMeasure && "avant prise en compte des mesures de correction "}
        est de <strong>{results.worst.note}/35</strong>.
      </Text>
      {results.worst.note < results.best.note && (
        <Text fontSize="sm" color="gray.500" fontStyle="italic">
          Cette note n'a pas été retenue dans le calcul de votre index car elle est la moins favorable
        </Text>
      )}
      <Text fontSize="sm" color="gray.500" fontStyle="italic">
        {messageEcartNombreEquivalentSalaries(indicateurSexeSurRepresente, plusPetitNombreSalaries)}
      </Text>
      {correctionMeasure && (
        <Text fontSize="sm" color="gray.500" fontStyle="italic">
          {messageMesureCorrection(indicateurSexeSurRepresente, "d'augmentations", "35/35")}
        </Text>
      )}
    </VStack>
  )
}

export default IndicateurDeuxTrois
