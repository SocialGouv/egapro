import React, { FunctionComponent, useState } from "react"
import { Box, List, ListItem, Text } from "@chakra-ui/react"
import { Form } from "react-final-form"
import arrayMutators from "final-form-arrays"
import { FieldArray } from "react-final-form-arrays"

import { ActionIndicateurUnCoefData, FormState, AppState } from "../../../globals"

import InfoBlock from "../../../components/ds/InfoBlock"
import ActionLink from "../../../components/ActionLink"
import ButtonAction from "../../../components/ds/ButtonAction"
import ActionBar from "../../../components/ActionBar"
import FormAutoSave from "../../../components/FormAutoSave"
import FormSubmit from "../../../components/FormSubmit"
import Modal from "../../../components/ds/Modal"

import InputField from "./components/CoefGroupInputField"
import FormError from "../../../components/FormError"
import FormStack from "../../../components/ds/FormStack"
import { IconDelete, IconPlusCircle } from "../../../components/ds/Icons"

interface IndicateurUnCoefGroupFormProps {
  state: AppState
  updateIndicateurUnCoefAddGroup: () => void
  updateIndicateurUnCoefDeleteGroup: (index: number) => void
  updateIndicateurUnCoef: (data: ActionIndicateurUnCoefData) => void
  validateIndicateurUnCoefGroup: (valid: FormState) => void
  navigateToEffectif: () => void
  navigateToRemuneration: () => void
}

const IndicateurUnCoefGroupForm: FunctionComponent<IndicateurUnCoefGroupFormProps> = ({
  state,
  updateIndicateurUnCoefAddGroup,
  updateIndicateurUnCoefDeleteGroup,
  updateIndicateurUnCoef,
  validateIndicateurUnCoefGroup,
  navigateToEffectif,
  navigateToRemuneration,
}) => {
  const { coefficient, coefficientGroupFormValidated, coefficientEffectifFormValidated, formValidated } =
    state.indicateurUn
  const readOnly = coefficientGroupFormValidated === "Valid"

  const initialValues = { groupes: coefficient }

  const saveForm = (formData: any) => {
    updateIndicateurUnCoef({ coefficient: formData.groupes })
  }

  const onSubmit = (formData: any) => {
    saveForm(formData)
    validateIndicateurUnCoefGroup("Valid")
  }

  const [indexGroupToDelete, setIndexGroupToDelete] = useState<number | undefined>(undefined)
  const confirmGroupToDelete = (index: number) => setIndexGroupToDelete(index)
  const closeModal = () => setIndexGroupToDelete(undefined)

  return (
    <>
      <Form
        onSubmit={onSubmit}
        mutators={{
          // potentially other mutators could be merged here
          ...arrayMutators,
        }}
        initialValues={initialValues}
      >
        {({ handleSubmit, hasValidationErrors, submitFailed }) => (
          <form onSubmit={handleSubmit}>
            <FormAutoSave saveForm={saveForm} />
            <FormStack>
              {submitFailed && hasValidationErrors && (
                <FormError message="Les groupes ne peuvent pas être validés si tous les champs ne sont pas remplis." />
              )}

              <FieldArray name="groupes">
                {({ fields }) => (
                  <>
                    {fields.length === 0 ? (
                      <Box textAlign="center" pt={6}>
                        <Text fontSize="sm" color="gray.500">
                          Aucun niveau ou coefficient hiérarchique renseigné.
                          <br />
                          Vous pouvez en ajouter en utilisant le bouton ci-dessous.
                        </Text>
                      </Box>
                    ) : (
                      fields.map((name, index) => (
                        <InputField
                          key={index}
                          name={`${name}.name`}
                          index={index}
                          deleteGroup={confirmGroupToDelete}
                          editGroup={() => validateIndicateurUnCoefGroup("None")}
                          readOnly={readOnly}
                        />
                      ))
                    )}
                  </>
                )}
              </FieldArray>
              {!readOnly && (
                <Box textAlign="center">
                  <ButtonAction
                    size="sm"
                    variant="outline"
                    label="Ajouter un niveau ou coefficient hiérarchique"
                    onClick={updateIndicateurUnCoefAddGroup}
                    leftIcon={<IconPlusCircle />}
                  />
                </Box>
              )}
            </FormStack>

            {readOnly ? (
              <ActionBar borderTop="1px solid" borderColor="gray.200" pt={4}>
                <ButtonAction onClick={navigateToEffectif} label="Suivant" size="lg" />
                <ButtonAction
                  onClick={() => validateIndicateurUnCoefGroup("None")}
                  label="Modifier les groupes"
                  variant="link"
                />
              </ActionBar>
            ) : (
              coefficient.length > 0 && (
                <ActionBar borderTop="1px solid" borderColor="gray.200" pt={4}>
                  <FormSubmit />
                </ActionBar>
              )
            )}
          </form>
        )}
      </Form>

      {coefficientGroupFormValidated === "Valid" &&
        (coefficientEffectifFormValidated === "Invalid" || formValidated === "Invalid") && (
          <InfoBlock
            mt={4}
            title="Vos groupes ont été modifiés"
            type="success"
            text={
              <>
                <Text>
                  Afin de s'assurer de la cohérence de votre indicateur, merci de vérifier les données de vos étapes.
                </Text>
                <List mt={1}>
                  {coefficientEffectifFormValidated === "Invalid" && (
                    <ListItem>
                      <ActionLink onClick={navigateToEffectif}>Aller à l'étape 2&nbsp;: effectifs</ActionLink>
                    </ListItem>
                  )}
                  {formValidated === "Invalid" && (
                    <ListItem>
                      <ActionLink onClick={navigateToRemuneration}>Aller à l'étape 3&nbsp;: rémunérations</ActionLink>
                    </ListItem>
                  )}
                </List>
              </>
            }
          />
        )}

      <Modal
        isOpen={indexGroupToDelete !== undefined}
        onClose={closeModal}
        title="Êtes vous sûr de vouloir supprimer ce groupe ?"
        footer={
          <>
            <ButtonAction
              colorScheme="red"
              leftIcon={<IconDelete />}
              onClick={() => {
                indexGroupToDelete !== undefined && updateIndicateurUnCoefDeleteGroup(indexGroupToDelete)
                closeModal()
              }}
              label="Supprimer"
            />
            <ButtonAction colorScheme="gray" onClick={() => closeModal()} label="Annuler" />
          </>
        }
      >
        <Text>Toutes les données renseignées pour ce groupes seront effacées définitivement.</Text>
      </Modal>
    </>
  )
}

export default IndicateurUnCoefGroupForm
