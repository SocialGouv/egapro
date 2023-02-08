import React, { FunctionComponent, ReactNode } from "react"
import { Form } from "react-final-form"

import { TrancheAge, GroupTranchesAgesIndicateurUn, FormState } from "../../globals"

import {
  composeValidators,
  minNumber,
  mustBeNumber,
  parseFloatFormValue,
  parseFloatStateValue,
  required,
  ValidatorFunction,
} from "../../utils/formHelpers"
import { displayNameTranchesAges } from "../../utils/helpers"

import BlocForm from "../../components/BlocForm"
import FieldInputsMenWomen from "../../components/FieldInputsMenWomen"
import ActionBar from "../../components/ActionBar"
import FormAutoSave from "../../components/FormAutoSave"
import FormSubmit from "../../components/FormSubmit"
import FormError from "../../components/FormError"
import FormStack from "../../components/ds/FormStack"

export const aboveZero: ValidatorFunction = (value) =>
  minNumber(1)(value) ? "La valeur ne peut être inférieure ou égale à 0" : undefined

const validator = composeValidators(required, mustBeNumber, aboveZero)

interface remunerationGroup {
  id: any
  name: string
  trancheAge: TrancheAge
  validiteGroupe: boolean
  remunerationAnnuelleBrutFemmes?: number
  remunerationAnnuelleBrutHommes?: number
}

interface IndicateurUnFormRawProps {
  ecartRemuParTrancheAge: Array<remunerationGroup>
  readOnly: boolean
  updateIndicateurUn: (
    data: Array<{
      id: any
      tranchesAges: Array<GroupTranchesAgesIndicateurUn>
    }>,
  ) => void
  validateIndicateurUn: (valid: FormState) => void
  nextLink: ReactNode
}

const groupByCSP = (
  ecartRemuParTrancheAge: Array<remunerationGroup>,
): Array<{
  id: any
  name: string
  tranchesAges: Array<remunerationGroup>
}> => {
  const tmpArray = ecartRemuParTrancheAge.reduce((acc, { id, name, ...otherAttr }) => {
    // @ts-ignore
    const el = acc[id]

    if (el) {
      return {
        ...acc,
        [id]: {
          ...el,
          tranchesAges: [...el.tranchesAges, otherAttr],
        },
      }
    } else {
      return {
        ...acc,
        [id]: {
          id,
          name,
          tranchesAges: [otherAttr],
        },
      }
    }
  }, {})

  // @ts-ignore
  // TODO REFACTOR: remplacer par return Object.values(tmpArray)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return Object.entries(tmpArray).map(([_, tranchesAges]) => tranchesAges)
}

const IndicateurUnFormRaw: FunctionComponent<IndicateurUnFormRawProps> = ({
  ecartRemuParTrancheAge,
  readOnly,
  updateIndicateurUn,
  validateIndicateurUn,
  nextLink,
}) => {
  const initialValues = {
    remunerationAnnuelle: groupByCSP(ecartRemuParTrancheAge).map(({ tranchesAges, ...otherPropGroupe }: any) => ({
      ...otherPropGroupe,
      tranchesAges: tranchesAges.map(
        ({ remunerationAnnuelleBrutFemmes, remunerationAnnuelleBrutHommes, ...otherPropsTrancheAge }: any) => {
          return {
            ...otherPropsTrancheAge,
            remunerationAnnuelleBrutFemmes: parseFloatStateValue(remunerationAnnuelleBrutFemmes),
            remunerationAnnuelleBrutHommes: parseFloatStateValue(remunerationAnnuelleBrutHommes),
          }
        },
      ),
    })),
  }

  const saveForm = (formData: any) => {
    const remunerationAnnuelle = formData.remunerationAnnuelle.map(({ tranchesAges, ...otherPropGroupe }: any) => ({
      ...otherPropGroupe,
      tranchesAges: tranchesAges.map(
        ({ remunerationAnnuelleBrutFemmes, remunerationAnnuelleBrutHommes, trancheAge }: any) => {
          return {
            trancheAge,
            remunerationAnnuelleBrutFemmes: parseFloatFormValue(remunerationAnnuelleBrutFemmes),
            remunerationAnnuelleBrutHommes: parseFloatFormValue(remunerationAnnuelleBrutHommes),
          }
        },
      ),
    }))
    updateIndicateurUn(remunerationAnnuelle)
  }

  const onSubmit = (formData: any) => {
    saveForm(formData)
    validateIndicateurUn("Valid")
  }

  return (
    <Form
      onSubmit={onSubmit}
      initialValues={initialValues}
      // mandatory to not change user inputs
      // because we want to keep wrong string inside the input
      // we don't want to block string value
      initialValuesEqual={() => true}
    >
      {({ handleSubmit, hasValidationErrors, submitFailed }) => (
        <form onSubmit={handleSubmit}>
          <FormAutoSave saveForm={saveForm} />
          <FormStack>
            {submitFailed && hasValidationErrors && (
              <FormError message="L’indicateur ne peut être calculé car tous les champs ne sont pas renseignés." />
            )}
            {initialValues.remunerationAnnuelle.map(
              (
                {
                  id,
                  name,
                  tranchesAges,
                }: {
                  id: any
                  name: string
                  tranchesAges: Array<{
                    trancheAge: TrancheAge
                    validiteGroupe: boolean
                  }>
                },
                indexGroupe,
              ) => {
                return (
                  <BlocForm key={id} title={name} label="rémunération moyenne">
                    {tranchesAges.map(({ trancheAge, validiteGroupe }, indexTrancheAge) => {
                      return (
                        <FieldInputsMenWomen
                          key={trancheAge}
                          legend="Rémunération moyenne des"
                          label={{
                            women: `Rémunération moyenne des femmes de ${displayNameTranchesAges(trancheAge)}`,
                            men: `Rémunération moyenne des hommes de ${displayNameTranchesAges(trancheAge)}`,
                          }}
                          title={displayNameTranchesAges(trancheAge)}
                          readOnly={readOnly}
                          calculable={validiteGroupe}
                          calculableNumber={3}
                          mask="number"
                          femmeFieldName={`remunerationAnnuelle.${indexGroupe}.tranchesAges.${indexTrancheAge}.remunerationAnnuelleBrutFemmes`}
                          hommeFieldName={`remunerationAnnuelle.${indexGroupe}.tranchesAges.${indexTrancheAge}.remunerationAnnuelleBrutHommes`}
                          validatorFemmes={validator}
                          validatorHommes={validator}
                        />
                      )
                    })}
                  </BlocForm>
                )
              },
            )}
          </FormStack>

          {readOnly ? (
            <ActionBar>{nextLink}</ActionBar>
          ) : (
            <ActionBar>
              <FormSubmit />
            </ActionBar>
          )}
        </form>
      )}
    </Form>
  )
}

export default IndicateurUnFormRaw
