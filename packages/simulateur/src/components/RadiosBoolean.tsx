import React, { FunctionComponent } from "react"

import { FormControl, FormLabel } from "@chakra-ui/react"
import InputRadioGroup from "./ds/InputRadioGroup"
import InputRadio from "./ds/InputRadio"

interface RadiosBooleanProps {
  readOnly: boolean
  fieldName: string
  value?: string
  label?: string | React.ReactElement
}

const RadiosBoolean: FunctionComponent<RadiosBooleanProps> = ({ readOnly, fieldName, label, value }) => {
  return (
    <FormControl isReadOnly={readOnly}>
      <FormLabel as="div">{label}</FormLabel>
      <InputRadioGroup defaultValue={value}>
        <InputRadio value="true" choiceValue="true" fieldName={fieldName} isReadOnly={readOnly}>
          Oui
        </InputRadio>
        <InputRadio value="false" choiceValue="false" fieldName={fieldName} isReadOnly={readOnly}>
          Non
        </InputRadio>
      </InputRadioGroup>
    </FormControl>
  )
}

export default RadiosBoolean
