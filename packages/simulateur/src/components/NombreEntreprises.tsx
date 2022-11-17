/** @jsxImportSource @emotion/react */
import { Box, Text } from "@chakra-ui/react"
import { css } from "@emotion/react"
import { useState } from "react"
import { Field, useForm, useFormState } from "react-final-form"

import globalStyles from "../utils/globalStyles"

import {
  composeValidators,
  minNumber,
  mustBeInteger,
  mustBeNumber,
  required,
  ValidatorFunction,
} from "../utils/formHelpers"

import { useDisclosure } from "@chakra-ui/hooks"
import ButtonAction from "./ds/ButtonAction"
import Modal from "./ds/Modal"

const atLeastTwo: ValidatorFunction = (value) =>
  minNumber(2)(value) ? "le nombre d'entreprises composant l'UES doit être un nombre supérieur ou égal à 2" : undefined

export const validator = composeValidators(required, mustBeNumber, mustBeInteger, atLeastTwo)

function NombreEntreprises({ readOnly }: { readOnly: boolean }) {
  const { onClose } = useDisclosure()
  const form = useForm()
  const formState = useFormState()
  // const [newValue, setNewValue] = useState<string | undefined>(undefined)
  // const confirmChangeEvent = (newValue: string) => {
  //   setNewValue(newValue)
  // }
  // const closeModal = () => {
  //   setNewValue(undefined)
  //   onClose()
  // }

  return (
    <Field name="nombreEntreprises" validate={validator}>
      {({ input, meta }) => (
        <Box mb={4}>
          <label css={[styles.label, meta.error && meta.touched && styles.labelError]} htmlFor={input.name}>
            Nombre d'entreprises composant l'UES (le déclarant compris)
          </label>
          <div css={styles.fieldRow}>
            <input
              css={[styles.input, meta.error && meta.touched && styles.inputError]}
              // {...input}
              value={formState.values.entreprisesUES?.length}
              readOnly={true}
              // onChange={(event) => {
              //   const newValue = event.target.value
              //   const newSize = isNaN(Number(newValue)) ? 0 : Number(newValue)

              //   console.log("newValue", newValue)
              //   console.log("newSize", newSize)
              //   console.log(
              //     "form.getState().values.entreprisesUES.length",
              //     form.getState().values.entreprisesUES.length,
              //   )

              //   if (
              //     validator(newValue) !== undefined || // Si invalide, sera bloqué au niveau de la validation du champ dans RFF
              //     newSize > form.getState().values.entreprisesUES.length
              //   ) {
              //     // Let pass the event as usual.
              //     input.onChange(event)
              //   } else {
              //     // Ask user if it's ok to remove some Siren.
              //     confirmChangeEvent(event.target.value)
              //   }
              // }}
            />
          </div>
          {meta.error && meta.touched && <p css={styles.error}>{meta.error}</p>}
          {/* <Modal
            isOpen={newValue !== undefined}
            onClose={closeModal}
            title="Êtes-vous sûr de vouloir réduire le nombre d'entreprises composant l'UES ?"
            footer={
              <div>
                <ButtonAction
                  onClick={() => {
                    if (newValue !== undefined) {
                      form.mutators.setNombreEntreprisesMutator("nombreEntreprises", newValue)
                    }
                    closeModal()
                  }}
                  label="Confirmer et supprimer les données"
                />
                <ButtonAction colorScheme="gray" onClick={() => closeModal()} label="Annuler" />
              </div>
            }
          >
            <Text>Toutes les données renseignées pour ces entreprises seront effacées définitivement.</Text>
          </Modal> */}
        </Box>
      )}
    </Field>
  )
}

const styles = {
  label: css({
    fontSize: 14,
    fontWeight: "bold",
    lineHeight: "17px",
  }),
  labelError: css({
    color: globalStyles.colors.error,
  }),
  input: css({
    appearance: "none",
    border: `solid ${globalStyles.colors.default} 1px`,
    width: "100%",
    fontSize: 14,
    lineHeight: "17px",
    paddingLeft: 22,
    paddingRight: 22,
  }),
  inputError: css({
    color: globalStyles.colors.error,
    borderColor: globalStyles.colors.error,
  }),
  fieldRow: css({
    height: 38,
    marginTop: 5,
    marginBottom: 5,
    display: "flex",
    input: {
      borderRadius: 4,
      border: "1px solid",
    },
    "input[readonly]": { border: 0 },
  }),
  error: css({
    height: 18,
    color: globalStyles.colors.error,
    fontSize: 12,
    textDecoration: "underline",
    lineHeight: "15px",
  }),
}

export default NombreEntreprises
