import { Grid, GridItem, Text } from "@chakra-ui/react"
import React, { FunctionComponent, ReactNode } from "react"
import { Form } from "react-final-form"

import { EffectifPourTrancheAge } from "../../globals"

import {
  composeFormValidators,
  composeValidators,
  FormValidatorFunction,
  minNumber,
  mustBeInteger,
  mustBeNumber,
  parseIntFormValue,
  parseIntStateValue,
  required,
} from "../../utils/formHelpers"
import { displayInt, displayNameTranchesAges } from "../../utils/helpers"

import ActionBar from "../../components/ActionBar"
import BlocForm from "../../components/BlocForm"
import FormStack from "../../components/ds/FormStack"
import FieldInputsMenWomen from "../../components/FieldInputsMenWomen"
import FormAutoSave from "../../components/FormAutoSave"
import FormError from "../../components/FormError"
import FormSubmit from "../../components/FormSubmit"

type Effectif = Array<{
  id: any
  name: string
  tranchesAges: Array<EffectifPourTrancheAge>
}>

const validator = composeValidators(required, mustBeNumber, mustBeInteger, minNumber(0))

interface EffectifFormRawProps {
  effectifRaw: Effectif
  readOnly: boolean
  updateEffectif: (data: Effectif) => void
  setValidEffectif: () => void
  nextLink: ReactNode
  formValidator?: FormValidatorFunction
}

const getTotalGroupNbSalarie = (tranchesAges: Array<EffectifPourTrancheAge>) =>
  tranchesAges.reduce(
    (accGroup, { nombreSalariesHommes, nombreSalariesFemmes }) => {
      return {
        totalGroupNbSalarieHomme: accGroup.totalGroupNbSalarieHomme + (Number(nombreSalariesHommes) || 0),
        totalGroupNbSalarieFemme: accGroup.totalGroupNbSalarieFemme + (Number(nombreSalariesFemmes) || 0),
      }
    },
    { totalGroupNbSalarieHomme: 0, totalGroupNbSalarieFemme: 0 },
  )

export const getTotalNbSalarie = (effectif: Effectif) =>
  effectif.reduce(
    (acc, { tranchesAges }) => {
      const { totalGroupNbSalarieHomme, totalGroupNbSalarieFemme } = getTotalGroupNbSalarie(tranchesAges)

      return {
        totalNbSalarieHomme: acc.totalNbSalarieHomme + totalGroupNbSalarieHomme,
        totalNbSalarieFemme: acc.totalNbSalarieFemme + totalGroupNbSalarieFemme,
      }
    },
    { totalNbSalarieHomme: 0, totalNbSalarieFemme: 0 },
  )

/**
 * Composant pour renseigner les informations d'effectif.
 * Utilisé par la page Effectif et par la page indicateur 1 avec le mode de calcul coefficient/autre.
 */
const EffectifFormRaw: FunctionComponent<EffectifFormRawProps> = ({
  effectifRaw,
  readOnly,
  updateEffectif,
  setValidEffectif,
  nextLink,
  formValidator,
}) => {
  const initialValues = {
    effectif: effectifRaw.map(({ tranchesAges, ...otherPropGroupe }: any) => ({
      ...otherPropGroupe,
      tranchesAges: tranchesAges.map(({ nombreSalariesFemmes, nombreSalariesHommes, ...otherPropsTrancheAge }: any) => {
        return {
          ...otherPropsTrancheAge,
          nombreSalariesFemmes: parseIntStateValue(nombreSalariesFemmes),
          nombreSalariesHommes: parseIntStateValue(nombreSalariesHommes),
        }
      }),
    })),
  }

  const { totalNbSalarieHomme, totalNbSalarieFemme } = getTotalNbSalarie(effectifRaw)

  const formValidatorEffectif = ({ effectif }: any) => {
    const { totalNbSalarieHomme, totalNbSalarieFemme } = getTotalNbSalarie(effectif)
    return totalNbSalarieFemme + totalNbSalarieHomme <= 0
      ? "Le nombre total d'effectifs pris en compte ne peut pas être égal à zéro."
      : undefined
  }

  const validateForm = (values: Record<string, unknown>) => {
    const composedValidator = formValidator
      ? composeFormValidators(formValidatorEffectif, formValidator)
      : formValidatorEffectif
    const error = composedValidator(values)
    return error ? { message: error } : undefined
  }

  const saveForm = (formData: typeof initialValues) => {
    const effectif = formData.effectif.map(({ tranchesAges, ...otherPropGroupe }: any) => ({
      ...otherPropGroupe,
      tranchesAges: tranchesAges.map(({ nombreSalariesFemmes, nombreSalariesHommes, ...otherPropsTrancheAge }: any) => {
        return {
          ...otherPropsTrancheAge,
          nombreSalariesFemmes: parseIntFormValue(nombreSalariesFemmes),
          nombreSalariesHommes: parseIntFormValue(nombreSalariesHommes),
        }
      }),
    }))
    updateEffectif(effectif)
  }

  const onSubmit = (formData: typeof initialValues) => {
    saveForm(formData)
    setValidEffectif()
  }

  return (
    <Form
      onSubmit={onSubmit}
      validate={validateForm}
      initialValues={initialValues}
      // mandatory to not change user inputs
      // because we want to keep wrong string inside the input
      // we don't want to block string value
      initialValuesEqual={() => true}
    >
      {({ handleSubmit, hasValidationErrors, submitFailed, errors }) => {
        return (
          <form onSubmit={handleSubmit}>
            <FormAutoSave saveForm={saveForm} />
            <FormStack>
              {submitFailed && hasValidationErrors && (
                <FormError
                  message={
                    errors?.message
                      ? errors.message
                      : "Les effectifs ne peuvent pas être validés si tous les champs ne sont pas remplis."
                  }
                />
              )}

              {effectifRaw.map(({ id, name, tranchesAges }, indexGroupe) => {
                const { totalGroupNbSalarieHomme, totalGroupNbSalarieFemme } = getTotalGroupNbSalarie(tranchesAges)
                return (
                  <BlocForm
                    key={id}
                    title={name}
                    label="Nombre de salariés"
                    footer={[displayInt(totalGroupNbSalarieFemme), displayInt(totalGroupNbSalarieHomme)]}
                  >
                    {tranchesAges.map(({ trancheAge }, indexTrancheAge) => {
                      return (
                        <FieldInputsMenWomen
                          key={trancheAge}
                          readOnly={readOnly}
                          legend="Nombre de salariés de"
                          label={{
                            women: `Nombre de femmes de ${displayNameTranchesAges(trancheAge)}`,
                            men: `Nombre d'hommes de ${displayNameTranchesAges(trancheAge)}`,
                          }}
                          title={displayNameTranchesAges(trancheAge)}
                          calculable={true}
                          calculableNumber={0}
                          mask="number"
                          validatorFemmes={validator}
                          validatorHommes={validator}
                          femmeFieldName={`effectif.${indexGroupe}.tranchesAges.${indexTrancheAge}.nombreSalariesFemmes`}
                          hommeFieldName={`effectif.${indexGroupe}.tranchesAges.${indexTrancheAge}.nombreSalariesHommes`}
                        />
                      )
                    })}
                  </BlocForm>
                )
              })}
            </FormStack>

            <Grid templateColumns="1fr 5.5rem 5.5rem" gap={2} mt={6} px={4} textAlign="right">
              <GridItem pr={2}>Total des effectifs&nbsp;:</GridItem>
              <GridItem pr={5}>
                <Text fontWeight="semibold" noOfLines={1} lineHeight="1" mt={1}>
                  {displayInt(totalNbSalarieFemme)}
                </Text>
                <Text fontSize="xs" color="women">
                  Femmes
                </Text>
              </GridItem>
              <GridItem pr={5}>
                <Text fontWeight="semibold" noOfLines={1} lineHeight="1" mt={1}>
                  {displayInt(totalNbSalarieHomme)}
                </Text>
                <Text fontSize="xs" color="men">
                  Hommes
                </Text>
              </GridItem>
            </Grid>

            <Grid templateColumns="1fr 5.5rem 5.5rem" gap={2} mt={4} px={4} textAlign="right">
              <GridItem pr={2}>Soit&nbsp;:</GridItem>
              <GridItem pr={5} colSpan={2}>
                <Text fontWeight="semibold" noOfLines={1} lineHeight="1" mt={1}>
                  {displayInt(totalNbSalarieHomme + totalNbSalarieFemme)}
                </Text>
                <Text fontSize="xs">Personnes</Text>
              </GridItem>
            </Grid>

            {readOnly ? (
              <ActionBar>{nextLink}</ActionBar>
            ) : (
              <ActionBar>
                <FormSubmit />
              </ActionBar>
            )}
          </form>
        )
      }}
    </Form>
  )
}

export default EffectifFormRaw
