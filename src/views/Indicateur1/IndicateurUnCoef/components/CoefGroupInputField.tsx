import React, { FunctionComponent } from "react"
import { useField } from "react-final-form"
import { InputGroup, FormControl, FormErrorMessage, FormLabel, InputRightElement } from "@chakra-ui/react"

import { required } from "../../../../utils/formHelpers"

import Input, { hasFieldError } from "../../../../components/Input"
import ButtonAction from "../../../../components/ds/ButtonAction"

const validate = (value: string) => {
  const requiredError = required(value)

  if (!requiredError) {
    return undefined
  } else {
    return { required: requiredError }
  }
}

interface InputFieldProps {
  name: string
  index: number
  deleteGroup: (index: number) => void
  editGroup: () => void
  readOnly: boolean
}

const InputField: FunctionComponent<InputFieldProps> = ({ name, index, deleteGroup, editGroup, readOnly }) => {
  const field = useField(name, {
    validate,
    parse: (value) => value,
    format: (value) => value,
  })
  const error = hasFieldError(field.meta)

  return (
    <FormControl isInvalid={error}>
      <FormLabel htmlFor={field.input.name}>{`Groupe ${index + 1}`}</FormLabel>
      <InputGroup>
        <Input
          pr={readOnly ? "4.125rem" : "5.875rem"}
          id={field.input.name}
          placeholder="Donnez un nom à votre groupe"
          type="text"
          field={field}
          isReadOnly={readOnly}
        />
        <InputRightElement width={readOnly ? "4.125rem" : "5.875rem"}>
          <ButtonAction
            size="sm"
            onClick={() => (readOnly ? editGroup() : deleteGroup(index))}
            label={readOnly ? "Éditer" : "Supprimer"}
            variant="ghost"
            colorScheme={readOnly ? "primary" : "red"}
          />
        </InputRightElement>
      </InputGroup>
      <FormErrorMessage>Vous devez donner un nom à votre groupe</FormErrorMessage>
    </FormControl>
  )
}

export default InputField
