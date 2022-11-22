import { FormControl, FormLabel, SimpleGrid } from "@chakra-ui/react"
import React, { FunctionComponent } from "react"
import { useField } from "react-final-form"

import { EntrepriseUES } from "../../../globals"
import { composeValidators, required } from "../../../utils/formHelpers"
import FakeInputGroup from "../../../components/ds/FakeInputGroup"
import FieldSiren, { sirenValidator } from "../../../components/FieldSiren"
import { hasFieldError } from "../../../components/Input"
import { useSiren } from "../../../hooks/useSiren"

type EntrepriseUESInputProps = {
  nom: string
  siren: string
  index: number
  readOnly: boolean
  year: number
}

const checkDuplicates = (value: string, allValues: any) => {
  const sirenList = allValues.entreprisesUES.map((entreprise: EntrepriseUES) => entreprise.siren)
  sirenList.push(allValues.siren)
  if (sirenList.filter((siren: string) => siren === value).length >= 2) {
    return "ce numéro SIREN est déjà utilisé"
  }
  return undefined
}

const EntrepriseUESInput: FunctionComponent<EntrepriseUESInputProps> = ({ nom, siren, index, readOnly, year }) => {
  const nomField = useField(nom)
  const sirenField = useField(siren)
  const { entreprise } = useSiren(sirenField.input.value)

  return (
    <FormControl isInvalid={hasFieldError(nomField.meta)}>
      <FormLabel as="div">{`Entreprise ${index + 1}`}</FormLabel>
      <SimpleGrid columns={2} spacing={6}>
        {readOnly ? (
          <FakeInputGroup label="Siren de l'entreprise">{sirenField.input.value}</FakeInputGroup>
        ) : (
          <FieldSiren
            label="Siren de l'entreprise"
            name={siren}
            readOnly={readOnly}
            year={year}
            validator={composeValidators(
              required,
              checkDuplicates,
              // eslint-disable-next-line @typescript-eslint/no-empty-function
              sirenValidator(year)(() => {}),
            )}
          />
        )}
        <FakeInputGroup label="Nom de l'entreprise">{entreprise?.raison_sociale}</FakeInputGroup>
      </SimpleGrid>
    </FormControl>
  )
}

export default EntrepriseUESInput
