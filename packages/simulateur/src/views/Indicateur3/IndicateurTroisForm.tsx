import React, { FunctionComponent } from "react"
import { Form } from "react-final-form"

import calculerIndicateurTrois from "../../utils/calculsEgaProIndicateurTrois"
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

import { Text } from "@chakra-ui/react"
import ActionBar from "../../components/ActionBar"
import BlocForm from "../../components/BlocForm"
import FormStack from "../../components/ds/FormStack"
import FieldInputsMenWomen from "../../components/FieldInputsMenWomen"
import FormAutoSave from "../../components/FormAutoSave"
import FormError from "../../components/FormError"
import FormSubmit from "../../components/FormSubmit"
import RadiosBoolean from "../../components/RadiosBoolean"
import { ButtonSimulatorLink } from "../../components/SimulatorLink"
import { useAppStateContextProvider } from "../../hooks/useAppStateContextProvider"

const validator = composeValidators(required, mustBeNumber, minNumber(0))

const validateForm = ({
  tauxPromotion,
  presencePromotion,
}: {
  tauxPromotion: Array<{
    validiteGroupe: boolean
    tauxPromotionFemmes: string
    tauxPromotionHommes: string
  }>
  presencePromotion: string
}) => {
  if (presencePromotion === "false") {
    return undefined
  }

  const allInputs = tauxPromotion
    .filter((product) => product.validiteGroupe)
    .flatMap(({ tauxPromotionFemmes, tauxPromotionHommes }) => [tauxPromotionFemmes, tauxPromotionHommes])

  if (allInputs.every((input) => input === "0")) {
    return {
      notAll0: "Tous les champs ne peuvent pas être à 0 s'il y a eu des promotions.",
    }
  }

  if (allInputs.every((input) => input === "")) {
    return {
      notAll0: "L’indicateur ne peut être calculé car tous les champs ne sont pas renseignés.",
    }
  }
  return
}

interface IndicateurTroisFormProps {
  calculsIndicateurTrois: Pick<
    ReturnType<typeof calculerIndicateurTrois>,
    "effectifEtEcartPromoParGroupe" | "correctionMeasure" | "indicateurSexeSurRepresente"
  >
}

const IndicateurTroisForm: FunctionComponent<IndicateurTroisFormProps> = ({ calculsIndicateurTrois }) => {
  const { state, dispatch } = useAppStateContextProvider()

  if (!state) return null

  const presencePromotion = state.indicateurTrois.presencePromotion

  const readOnly = isFormValid(state.indicateurTrois)

  const {
    effectifEtEcartPromoParGroupe: ecartPromoParCategorieSocioPro,
    correctionMeasure,
    indicateurSexeSurRepresente,
  } = calculsIndicateurTrois

  const initialValues = {
    presencePromotion: parseBooleanStateValue(presencePromotion),
    tauxPromotion: ecartPromoParCategorieSocioPro.map(
      ({ tauxPromotionFemmes, tauxPromotionHommes, ...otherProps }: any) => ({
        ...otherProps,
        tauxPromotionFemmes: parseFloatStateValue(tauxPromotionFemmes),
        tauxPromotionHommes: parseFloatStateValue(tauxPromotionHommes),
      }),
    ),
  }

  const saveForm = (formData: any) => {
    const presencePromotion = parseBooleanFormValue(formData.presencePromotion)
    const tauxPromotion = formData.tauxPromotion.map(
      ({ categorieSocioPro, tauxPromotionFemmes, tauxPromotionHommes }: any) => ({
        categorieSocioPro,
        tauxPromotionFemmes: parseFloatFormValue(tauxPromotionFemmes),
        tauxPromotionHommes: parseFloatFormValue(tauxPromotionHommes),
      }),
    )

    dispatch({
      type: "updateIndicateurTrois",
      data: {
        tauxPromotion,
        presencePromotion,
      },
    })
  }

  const onSubmit = (formData: any) => {
    saveForm(formData)
    dispatch({ type: "validateIndicateurTrois", valid: "Valid" })
  }

  // Only for Total with updated values
  // const ecartPromoParCategorieSocioProPourTotal = ecartPromoParCategorieSocioPro.map(
  //   (groupAugment, index) => {
  //     const infoField = infoFields[index];
  //     const tauxPromotionFemmes = parseFloatFormValue(
  //       values[infoField.tauxPromotionFemmesName]
  //     );
  //     const tauxPromotionHommes = parseFloatFormValue(
  //       values[infoField.tauxPromotionHommesName]
  //     );
  //     const ecartTauxPromotion = calculEcartTauxPromotion(
  //       tauxPromotionFemmes,
  //       tauxPromotionHommes
  //     );
  //     return {
  //       ...groupAugment,
  //       tauxPromotionFemmes,
  //       tauxPromotionHommes,
  //       ecartTauxPromotion
  //     };
  //   }
  // );
  // const {
  //   totalTauxPromotionFemmes,
  //   totalTauxPromotionHommes
  // } = calculTotalEffectifsEtTauxPromotion(
  //   ecartPromoParCategorieSocioProPourTotal
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
                fieldName="presencePromotion"
                value={values.presencePromotion}
                readOnly={readOnly}
                label={<>Y a-t-il eu des promotions durant la période de référence&nbsp;?</>}
              />

              {values.presencePromotion === "true" && (
                <BlocForm
                  title="Pourcentage de promotions"
                  // footer={[
                  //   displayFractionPercent(totalTauxPromotionFemmes),
                  //   displayFractionPercent(totalTauxPromotionHommes)
                  // ]}
                >
                  {ecartPromoParCategorieSocioPro.map(({ categorieSocioPro, validiteGroupe }, index) => {
                    return (
                      <FieldInputsMenWomen
                        key={categorieSocioPro}
                        legend="% de salariés promus"
                        title={displayNameCategorieSocioPro(categorieSocioPro)}
                        label={{
                          women: `Pourcentage de femmes ${displayNameCategorieSocioPro(categorieSocioPro)} promues`,
                          men: `Pourcentage d'hommes ${displayNameCategorieSocioPro(categorieSocioPro)} promus`,
                        }}
                        readOnly={readOnly}
                        calculable={validiteGroupe}
                        calculableNumber={10}
                        mask="percent"
                        femmeFieldName={`tauxPromotion.${index}.tauxPromotionFemmes`}
                        hommeFieldName={`tauxPromotion.${index}.tauxPromotionHommes`}
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
                <ButtonSimulatorLink to="/indicateur4" label="Suivant" />
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
          {messageMesureCorrection(indicateurSexeSurRepresente, "de promotions", "15/15")}
        </Text>
      )}
    </>
  )
}

export default IndicateurTroisForm
