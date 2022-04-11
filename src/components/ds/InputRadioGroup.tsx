import React, { FunctionComponent } from "react"

import { RadioGroup, RadioGroupProps } from "@chakra-ui/react"
import { Stack } from "@chakra-ui/layout"

type RadioButtonGroupProps = RadioGroupProps

// @ts-ignore
const InputRadioGroup: FunctionComponent<RadioButtonGroupProps> = ({ children, ...rest }) => {
  return (
    <RadioGroup {...rest}>
      <Stack spacing={{ base: 2, sm: 5 }} direction={{ base: "column", sm: "row" }}>
        {children}
      </Stack>
    </RadioGroup>
  )
}

export default InputRadioGroup
