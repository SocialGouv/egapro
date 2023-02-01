import React, { FunctionComponent } from "react"
import { Form } from "react-final-form"

import calculerIndicateurDeux from "../../utils/calculsEgaProIndicateurDeux"

import ActionBar from "../../components/ActionBar"
import BlocForm from "../../components/BlocForm"
import FieldInputsMenWomen from "../../components/FieldInputsMenWomen"
import FormAutoSave from "../../components/FormAutoSave"
import FormSubmit from "../../components/FormSubmit"
import RadiosBoolean from "../../components/RadiosBoolean"
import { ButtonSimulatorLink } from "../../components/SimulatorLink"

import { Text } from "@chakra-ui/react"
import FormStack from "../../components/ds/FormStack"
import FormError from "../../components/FormError"
import { useAppStateContextProvider } from "../../hooks/useAppStateContextProvider"
import {
  composeValidators,
  isFormValid,
  minNumber,
  mustBeNumber,
  parseBooleanFormValue,
  parseBooleanStateValue,
  parseFloatFormValue,
  parseFloatStateValue,
  required,
} from "../../utils/formHelpers"
import { displayNameCategorieSocioPro, messageMesureCorrection } from "../../utils/helpers"

const validator = composeValidators(required, mustBeNumber, minNumber(0))

const validateForm = ({
  tauxAugmentation,
  presenceAugmentation,
}: {
  tauxAugmentation: Array<{
    validiteGroupe: boolean
    tauxAugmentationFemmes: string
    tauxAugmentationHommes: string
  }>
  presenceAugmentation: string
}) => {
  if (presenceAugmentation === "false") {
    return undefined
  }

  const allInputs = tauxAugmentation
    .filter((product) => product.validiteGroupe)
    .flatMap(({ tauxAugmentationFemmes, tauxAugmentationHommes }) => [tauxAugmentationFemmes, tauxAugmentationHommes])

  if (allInputs.every((input) => input === "0")) {
    return {
      notAll0: "Tous les champs ne peuvent pas être à 0 s'il y a eu des augmentations.",
    }
  }

  if (allInputs.every((input) => input === "")) {
    return {
      notAll0: "L’indicateur ne peut être calculé car tous les champs ne sont pas renseignés.",
    }
  }

  return
}

interface IndicateurDeuxFormProps {
  calculsIndicateurDeux: ReturnType<typeof calculerIndicateurDeux>
}

const IndicateurDeuxForm: FunctionComponent<IndicateurDeuxFormProps> = ({ calculsIndicateurDeux }) => {
  const { state, dispatch } = useAppStateContextProvider()

  if (!state) return null

  const readOnly = isFormValid(state.indicateurDeux)

  const presenceAugmentation = state.indicateurDeux.presenceAugmentation

  const {
    effectifEtEcartAugmentParGroupe: ecartAugmentParCategorieSocioPro,
    correctionMeasure,
    indicateurSexeSurRepresente,
  } = calculsIndicateurDeux

  const initialValues = {
    presenceAugmentation: parseBooleanStateValue(presenceAugmentation),
    tauxAugmentation: ecartAugmentParCategorieSocioPro.map(
      ({ tauxAugmentationFemmes, tauxAugmentationHommes, ...otherProps }: any) => ({
        ...otherProps,
        tauxAugmentationFemmes: parseFloatStateValue(tauxAugmentationFemmes),
        tauxAugmentationHommes: parseFloatStateValue(tauxAugmentationHommes),
      }),
    ),
  }

  const saveForm = (formData: any) => {
    const presenceAugmentation = parseBooleanFormValue(formData.presenceAugmentation)
    const tauxAugmentation = formData.tauxAugmentation.map(
      ({ categorieSocioPro, tauxAugmentationFemmes, tauxAugmentationHommes }: any) => ({
        categorieSocioPro,
        tauxAugmentationFemmes: parseFloatFormValue(tauxAugmentationFemmes),
        tauxAugmentationHommes: parseFloatFormValue(tauxAugmentationHommes),
      }),
    )

    dispatch({
      type: "updateIndicateurDeux",
      data: {
        tauxAugmentation,
        presenceAugmentation,
      },
    })
  }

  const onSubmit = (formData: any) => {
    saveForm(formData)
    dispatch({ type: "validateIndicateurDeux", valid: "Valid" })
  }

  // Only for Total with updated values
  // const ecartAugmentParCategorieSocioProPourTotal = ecartAugmentParCategorieSocioPro.map(
  //   (groupAugment, index) => {
  //     const infoField = infoFields[index];
  //     const tauxAugmentationFemmes = parseFloatFormValue(
  //       values[infoField.tauxAugmentationFemmesName]
  //     );
  //     const tauxAugmentationHommes = parseFloatFormValue(
  //       values[infoField.tauxAugmentationHommesName]
  //     );
  //     const ecartTauxAugmentation = calculEcartTauxAugmentation(
  //       tauxAugmentationFemmes,
  //       tauxAugmentationHommes
  //     );
  //     return {
  //       ...groupAugment,
  //       tauxAugmentationFemmes,
  //       tauxAugmentationHommes,
  //       ecartTauxAugmentation
  //     };
  //   }
  // );
  // const {
  //   totalTauxAugmentationFemmes,
  //   totalTauxAugmentationHommes
  // } = calculTotalEffectifsEtTauxAugmentation(
  //   ecartAugmentParCategorieSocioProPourTotal
  // );

  return (
    <>
      <Form
        onSubmit={onSubmit}
        validate={validateForm}
        initialValues={initialValues}
        // mandatory to not change user inputs
        // because we want to keep wrong string inside the input
        // we don't want to block string value
        initialValuesEqual={() => true}
      >
        {({ handleSubmit, values, hasValidationErrors, errors, submitFailed }) => (
          <form onSubmit={handleSubmit}>
            <FormAutoSave saveForm={saveForm} />
            <FormStack>
              {submitFailed && hasValidationErrors && (
                <FormError
                  message={
                    errors?.notAll0
                      ? errors.notAll0
                      : "L’indicateur ne peut être calculé car tous les champs ne sont pas renseignés."
                  }
                />
              )}
              <RadiosBoolean
                fieldName="presenceAugmentation"
                value={values.presenceAugmentation}
                readOnly={readOnly}
                label={
                  <>
                    Y a-t-il eu des augmentations individuelles (hors promotions) durant la période de référence&nbsp;?
                  </>
                }
              />

              {values.presenceAugmentation === "true" && (
                <BlocForm
                  title="Pourcentage d'augmentations"
                  // footer={[
                  //   displayFractionPercent(totalTauxAugmentationFemmes),
                  //   displayFractionPercent(totalTauxAugmentationHommes)
                  // ]}
                >
                  {ecartAugmentParCategorieSocioPro.map(({ categorieSocioPro, validiteGroupe }, index) => {
                    return (
                      <FieldInputsMenWomen
                        key={categorieSocioPro}
                        legend="% de salariés augmentés"
                        label={{
                          women: `Pourcentage de femmes ${displayNameCategorieSocioPro(categorieSocioPro)} augmentées`,
                          men: `Pourcentage d'hommes' ${displayNameCategorieSocioPro(categorieSocioPro)} augmentés`,
                        }}
                        title={displayNameCategorieSocioPro(categorieSocioPro)}
                        readOnly={readOnly}
                        calculable={validiteGroupe}
                        calculableNumber={10}
                        mask="percent"
                        femmeFieldName={`tauxAugmentation.${index}.tauxAugmentationFemmes`}
                        hommeFieldName={`tauxAugmentation.${index}.tauxAugmentationHommes`}
                        validatorFemmes={validator}
                        validatorHommes={validator}
                      />
                    )
                  })}
                </BlocForm>
              )}
            </FormStack>

            {readOnly ? (
              <ActionBar>
                <ButtonSimulatorLink to="/indicateur3" label="Suivant" />
              </ActionBar>
            ) : (
              <ActionBar>
                <FormSubmit />
              </ActionBar>
            )}
          </form>
        )}
      </Form>
      {readOnly && correctionMeasure && (
        <Text fontSize="sm" color="gray.500" fontStyle="italic" mt={6}>
          {messageMesureCorrection(indicateurSexeSurRepresente, "d'augmentations", "20/20")}
        </Text>
      )}
    </>
  )
}

export default IndicateurDeuxForm
