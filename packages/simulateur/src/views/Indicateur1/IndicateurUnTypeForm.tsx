import { FormControl, FormLabel, Stack, Text } from "@chakra-ui/react"
import React, { FunctionComponent } from "react"
import { Form } from "react-final-form"

import FormStack from "../../components/ds/FormStack"
import InputRadio from "../../components/ds/InputRadio"
import InputRadioGroup from "../../components/ds/InputRadioGroup"
import FormAutoSave from "../../components/FormAutoSave"
import { useAppStateContextProvider } from "../../hooks/useAppStateContextProvider"

interface IndicateurUnTypeFormProps {
  readOnly: boolean
}

const IndicateurUnTypeForm: FunctionComponent<IndicateurUnTypeFormProps> = ({ readOnly }) => {
  const { state, dispatch } = useAppStateContextProvider()

  if (!state) return null

  const { modaliteCalcul } = state.indicateurUn

  const initialValues = {
    modaliteCalcul,
  }

  const saveForm = (formData: { modaliteCalcul: "csp" | "coef" | "autre" | undefined }) => {
    const { modaliteCalcul } = formData

    dispatch({ type: "updateIndicateurUnType", data: { modaliteCalcul } })
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
              <InputRadioGroup defaultValue={values.modaliteCalcul}>
                <Stack>
                  <InputRadio value="csp" fieldName="modaliteCalcul" choiceValue="csp" isReadOnly={readOnly}>
                    Par catégorie socio-professionnelle
                  </InputRadio>
                  <InputRadio value="coef" fieldName="modaliteCalcul" choiceValue="coef" isReadOnly={readOnly}>
                    Par niveau ou coefficient hiérarchique en application de la classification de branche
                  </InputRadio>
                  <InputRadio value="autre" fieldName="modaliteCalcul" choiceValue="autre" isReadOnly={readOnly}>
                    Par niveau ou coefficient hiérarchique en application d'une autre méthode de cotation des postes
                  </InputRadio>
                </Stack>
              </InputRadioGroup>
            </FormControl>
            {values.modaliteCalcul !== "csp" && (
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
