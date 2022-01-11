import React, { FunctionComponent, useCallback } from "react"
import { Form } from "react-final-form"
import { Text } from "@chakra-ui/react"

import { ActionIndicateurUnTypeData, ActionType } from "../../globals"

import FormAutoSave from "../../components/FormAutoSave"
import RadioButtons from "../../components/RadioButtons"

interface IndicateurUnTypeFormProps {
  csp: boolean
  coef: boolean
  autre: boolean
  readOnly: boolean
  dispatch: (action: ActionType) => void
}

const IndicateurUnTypeForm: FunctionComponent<IndicateurUnTypeFormProps> = ({ coef, autre, readOnly, dispatch }) => {
  const updateIndicateurUnType = useCallback(
    (data: ActionIndicateurUnTypeData) => dispatch({ type: "updateIndicateurUnType", data }),
    [dispatch],
  )

  const initialValues = {
    modaliteDeclaration: coef ? "coef" : autre ? "autre" : "csp",
  }

  const saveForm = (formData: any) => {
    const { modaliteDeclaration } = formData
    let [csp, coef, autre] = [false, false, false]
    if (modaliteDeclaration === "coef") {
      coef = true
    } else if (modaliteDeclaration === "autre") {
      autre = true
    } else {
      csp = true
    }

    updateIndicateurUnType({ csp, coef, autre })
  }

  return (
    <Form
      onSubmit={() => {
        console.debug("onSubmit de IndicateurUnTypeForm")
      }}
      initialValues={initialValues}
    >
      {({ handleSubmit, values }) => (
        <form onSubmit={handleSubmit}>
          <FormAutoSave saveForm={saveForm} />
          <RadioButtons
            fieldName="modaliteDeclaration"
            label="Modalités de calcul de l'indicateur relatif à l'écart de rémunération
          entre les femmes et les hommes"
            value={values.modaliteDeclaration}
            readOnly={readOnly}
            choices={[
              {
                label: "Par catégorie socio-professionnelle",
                value: "csp",
              },
              {
                label: "Par niveau ou coefficient hiérarchique en application de la classification de branche",
                value: "coef",
              },
              {
                label:
                  "Par niveau ou coefficient hiérarchique en application d'une autre méthode de cotation des postes",
                value: "autre",
              },
            ]}
          />
          {values.modaliteDeclaration !== "csp" && (
            <Text>
              Si vous choisissez cette option, la consultation du CSE est obligatoire.
              <br />
              La date de consultation vous sera demandée au moment de la déclaration
            </Text>
          )}
        </form>
      )}
    </Form>
  )
}

export default IndicateurUnTypeForm
