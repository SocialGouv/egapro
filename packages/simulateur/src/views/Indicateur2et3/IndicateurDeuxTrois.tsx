import React, { useCallback, FunctionComponent, PropsWithChildren } from "react"
import { Text, VStack } from "@chakra-ui/react"
import { RouteComponentProps } from "react-router-dom"

import { AppState, FormState, ActionType, ActionIndicateurDeuxTroisData } from "../../globals"

import calculIndicateurDeuxTrois, {
  calculPlusPetitNombreSalaries,
  calculBarem,
} from "../../utils/calculsEgaProIndicateurDeuxTrois"
import totalNombreSalaries from "../../utils/totalNombreSalaries"
import { messageEcartNombreEquivalentSalaries, displayPercent, messageMesureCorrection } from "../../utils/helpers"
import { useTitle } from "../../utils/hooks"

import InfoBlock from "../../components/ds/InfoBlock"
import Page from "../../components/Page"
import LayoutFormAndResult from "../../components/LayoutFormAndResult"
import ActionBar from "../../components/ActionBar"
import ActionLink from "../../components/ActionLink"
import { ButtonSimulatorLink, TextSimulatorLink } from "../../components/SimulatorLink"

import IndicateurDeuxTroisForm from "./IndicateurDeuxTroisForm"
import IndicateurDeuxTroisResult from "./IndicateurDeuxTroisResult"

interface IndicateurDeuxTroisProps extends RouteComponentProps {
  state: AppState
  dispatch: (action: ActionType) => void
}

const title = "Indicateur écart de taux d'augmentation"

const IndicateurDeuxTrois: FunctionComponent<IndicateurDeuxTroisProps> = ({ state, dispatch }) => {
  useTitle(title)

  const updateIndicateurDeuxTrois = useCallback(
    (data: ActionIndicateurDeuxTroisData) => dispatch({ type: "updateIndicateurDeuxTrois", data }),
    [dispatch],
  )

  const validateIndicateurDeuxTrois = useCallback(
    (valid: FormState) => dispatch({ type: "validateIndicateurDeuxTrois", valid }),
    [dispatch],
  )

  const {
    effectifsIndicateurCalculable,
    indicateurEcartAugmentationPromotion,
    indicateurEcartNombreEquivalentSalaries,
    indicateurSexeSurRepresente,
    noteIndicateurDeuxTrois,
    correctionMeasure,
  } = calculIndicateurDeuxTrois(state)

  // le formulaire d'informations n'est pas validé
  if (state.informations.formValidated !== "Valid") {
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
  if (state.effectif.formValidated !== "Valid") {
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
        <div>
          <InfoBlock
            type="warning"
            title="Malheureusement votre indicateur n'est pas calculable"
            text="Les effectifs comprennent moins de 5 femmes ou moins de 5 hommes."
          />
          <ActionBar>
            <ButtonSimulatorLink to="/indicateur4" label="Suivant" />
          </ActionBar>
        </div>
      </PageIndicateurDeuxTrois>
    )
  }

  // formulaire indicateur validé mais données renseignées ne permettent pas de calculer l'indicateur
  if (state.indicateurDeuxTrois.formValidated === "Valid" && !state.indicateurDeuxTrois.presenceAugmentationPromotion) {
    return (
      <PageIndicateurDeuxTrois>
        <div>
          <InfoBlock
            type="warning"
            title="Malheureusement votre indicateur n'est pas calculable"
            text="Il n'y a pas eu d'augmentation durant la période de référence."
          />
          <ActionBar>
            <ActionLink onClick={() => validateIndicateurDeuxTrois("None")}>Modifier les données saisies</ActionLink>
          </ActionBar>
          <ActionBar>
            <ButtonSimulatorLink to="/indicateur4" label="Suivant" />
          </ActionBar>
        </div>
      </PageIndicateurDeuxTrois>
    )
  }

  const results = getResults(indicateurEcartAugmentationPromotion, indicateurEcartNombreEquivalentSalaries)

  const { totalNombreSalariesHomme: totalNombreSalariesHommes, totalNombreSalariesFemme: totalNombreSalariesFemmes } =
    totalNombreSalaries(state.effectif.nombreSalaries)
  const plusPetitNombreSalaries = calculPlusPetitNombreSalaries(totalNombreSalariesHommes, totalNombreSalariesFemmes)

  return (
    <PageIndicateurDeuxTrois>
      <LayoutFormAndResult
        childrenForm={
          <div>
            <IndicateurDeuxTroisForm
              // la page ne sera visible que si periodeSuffisante est true et donc finPeriodeReference sera renseignée
              finPeriodeReference={state.informations.finPeriodeReference as string}
              presenceAugmentationPromotion={state.indicateurDeuxTrois.presenceAugmentationPromotion}
              nombreAugmentationPromotionFemmes={state.indicateurDeuxTrois.nombreAugmentationPromotionFemmes}
              nombreAugmentationPromotionHommes={state.indicateurDeuxTrois.nombreAugmentationPromotionHommes}
              periodeDeclaration={state.indicateurDeuxTrois.periodeDeclaration}
              nombreSalaries={state.effectif.nombreSalaries}
              readOnly={state.indicateurDeuxTrois.formValidated === "Valid"}
              updateIndicateurDeuxTrois={updateIndicateurDeuxTrois}
              validateIndicateurDeuxTrois={validateIndicateurDeuxTrois}
            />
            {state.indicateurDeuxTrois.formValidated === "Valid" && (
              <AdditionalInfo
                results={results}
                indicateurSexeSurRepresente={indicateurSexeSurRepresente}
                plusPetitNombreSalaries={plusPetitNombreSalaries}
                correctionMeasure={correctionMeasure}
              />
            )}
          </div>
        }
        childrenResult={
          state.indicateurDeuxTrois.formValidated === "Valid" && (
            <IndicateurDeuxTroisResult
              bestResult={results.best}
              indicateurSexeSurRepresente={indicateurSexeSurRepresente}
              noteIndicateurDeuxTrois={noteIndicateurDeuxTrois}
              correctionMeasure={correctionMeasure}
              validateIndicateurDeuxTrois={validateIndicateurDeuxTrois}
            />
          )
        }
      />
    </PageIndicateurDeuxTrois>
  )
}

const PageIndicateurDeuxTrois = ({ children }: PropsWithChildren) => (
  <Page
    title={title}
    tagline="Le nombre de femmes et d'hommes ayant été augmentés durant la période de référence, ou pendant les deux ou trois dernières années."
  >
    {children}
  </Page>
)

export type Result = { label: string; result: string; note: number }
export type Results = { best: Result; worst: Result }

export const getResults = (
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

export function AdditionalInfo({
  indicateurSexeSurRepresente,
  plusPetitNombreSalaries,
  correctionMeasure,
  results,
}: {
  indicateurSexeSurRepresente: "hommes" | "femmes" | undefined
  plusPetitNombreSalaries: "hommes" | "femmes" | undefined
  correctionMeasure: boolean
  results: Results
}) {
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
