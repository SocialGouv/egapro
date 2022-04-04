import React, { FunctionComponent } from "react"
import { useField } from "react-final-form"
import { FormControl, FormLabel, SimpleGrid } from "@chakra-ui/react"

import { EntrepriseUES, EntrepriseType } from "../../../globals"

import { composeValidators, required } from "../../../utils/formHelpers"

import FakeInputGroup from "../../../components/ds/FakeInputGroup"
import { hasFieldError } from "../../../components/Input"
import FieldSiren, { sirenValidator } from "../../../components/FieldSiren"

type EntrepriseUESInputProps = {
  nom: string
  siren: string
  index: number
  readOnly: boolean
  updateSirenData: (sirenData: EntrepriseType) => void
}

const EntrepriseUESInput: FunctionComponent<EntrepriseUESInputProps> = ({
  nom,
  siren,
  index,
  readOnly,
  updateSirenData,
}) => {
  const checkDuplicates = (value: string, allValues: any) => {
    const sirenList = allValues.entreprisesUES.map((entreprise: EntrepriseUES) => entreprise.siren)
    sirenList.push(allValues.siren)
    if (sirenList.filter((siren: string) => siren === value).length >= 2) {
      return "ce numéro SIREN est déjà utilisé"
    }
    return undefined
  }

  const nomField = useField(nom, {
    validate: required,
    parse: (value) => value,
    format: (value) => value,
  })
  const sirenField = useField(siren, {
    validate: required,
    parse: (value) => value,
    format: (value) => value,
  })
  const nomError = hasFieldError(nomField.meta)

  return (
    <FormControl isInvalid={nomError}>
      <FormLabel as="div">{`Entreprise ${index + 1}`}</FormLabel>
      <SimpleGrid columns={2} spacing={6}>
        {readOnly ? (
          <FakeInputGroup label="Siren de l'entreprise">{sirenField.input.value}</FakeInputGroup>
        ) : (
          <FieldSiren
            label="Siren de l'entreprise"
            name={siren}
            readOnly={readOnly}
            updateSirenData={updateSirenData}
            validator={composeValidators(checkDuplicates, sirenValidator(updateSirenData))}
          />
        )}
        <FakeInputGroup label="Nom de l'entreprise">{nomField.input.value}</FakeInputGroup>
      </SimpleGrid>
    </FormControl>
  )
}

export default EntrepriseUESInput
