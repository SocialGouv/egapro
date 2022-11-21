import React, { FunctionComponent, useCallback } from "react"
import { Form } from "react-final-form"
import { FormControl, FormLabel, Text, Stack } from "@chakra-ui/react"

import { ActionIndicateurUnTypeData, ActionType } from "../../globals"

import InputRadioGroup from "../../components/ds/InputRadioGroup"
import InputRadio from "../../components/ds/InputRadio"
import FormStack from "../../components/ds/FormStack"
import FormAutoSave from "../../components/FormAutoSave"

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
          <FormStack>
            <FormControl isReadOnly={readOnly}>
              <FormLabel as="div">Modalité de calcul choisie pour cet indicateur</FormLabel>
              <InputRadioGroup defaultValue={values.modaliteDeclaration}>
                <Stack>
                  <InputRadio value="csp" fieldName="modaliteDeclaration" choiceValue="csp" isReadOnly={readOnly}>
                    Par catégorie socio-professionnelle
                  </InputRadio>
                  <InputRadio value="coef" fieldName="modaliteDeclaration" choiceValue="coef" isReadOnly={readOnly}>
                    Par niveau ou coefficient hiérarchique en application de la classification de branche
                  </InputRadio>
                  <InputRadio value="autre" fieldName="modaliteDeclaration" choiceValue="autre" isReadOnly={readOnly}>
                    Par niveau ou coefficient hiérarchique en application d'une autre méthode de cotation des postes
                  </InputRadio>
                </Stack>
              </InputRadioGroup>
            </FormControl>
            {values.modaliteDeclaration !== "csp" && (
              <Text fontSize="sm">
                Si vous choisissez cette option, la consultation du CSE est obligatoire.
                <br />
                La date de consultation vous sera demandée au moment de la déclaration.
              </Text>
            )}
          </FormStack>
        </form>
      )}
    </Form>
  )
}

export default IndicateurUnTypeForm
