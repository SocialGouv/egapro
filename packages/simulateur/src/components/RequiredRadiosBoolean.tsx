import React, { FunctionComponent } from "react"

import { FormControl, FormErrorMessage, FormLabel } from "@chakra-ui/react"
import InputRadioGroup from "./ds/InputRadioGroup"
import InputRadio from "./ds/InputRadio"
import { useField } from "react-final-form"
import { hasFieldError } from "./Input"
import { displayMetaErrors } from "../utils/form-error-helpers"

import { required } from "../utils/formHelpers"

const validate = (value: string) => {
  const requiredError = required(value)
  if (requiredError) {
    return {
      required: requiredError,
    }
  }
}

interface RequiredRadiosBooleanProps {
  readOnly: boolean
  fieldName: string
  value?: string
  label?: string | React.ReactElement
}

const RequiredRadiosBoolean: FunctionComponent<RequiredRadiosBooleanProps> = ({
  readOnly,
  fieldName,
  label,
  value,
}) => {
  const field = useField(fieldName, { validate })
  const error = hasFieldError(field.meta)

  return (
    <FormControl isReadOnly={readOnly} isInvalid={Boolean(error)}>
      <FormLabel as="div">{label}</FormLabel>
      <InputRadioGroup defaultValue={value}>
        <InputRadio value="true" choiceValue="true" fieldName={fieldName} isReadOnly={readOnly}>
          Oui
        </InputRadio>
        <InputRadio value="false" choiceValue="false" fieldName={fieldName} isReadOnly={readOnly}>
          Non
        </InputRadio>
      </InputRadioGroup>
      <FormErrorMessage>{error && displayMetaErrors(field.meta.error)}</FormErrorMessage>
    </FormControl>
  )
}

export default RequiredRadiosBoolean
