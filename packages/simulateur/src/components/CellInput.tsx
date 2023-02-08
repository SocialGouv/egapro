import React, { FunctionComponent } from "react"
import { FormControl, FormLabel, Input, InputGroup, InputLeftElement, VisuallyHidden } from "@chakra-ui/react"
import MaskedInput, { conformToMask } from "react-text-mask"
import createNumberMask from "text-mask-addons/dist/createNumberMask"
import { FieldRenderProps, FieldMetaState } from "react-final-form"

import { IconFemale, IconMale } from "./ds/Icons"

export const hasFieldError = (meta: FieldMetaState<string>) =>
  (meta.error && meta.submitFailed) ||
  (meta.error && meta.touched && !!Object.values({ ...meta.error, required: false }).filter((item) => !!item).length)

const numberMask = createNumberMask({
  prefix: "",
  includeThousandsSeparator: false,
})

const suffixPercent = "%"

const percentNumberMask = createNumberMask({
  prefix: "",
  includeThousandsSeparator: false,
  suffix: suffixPercent,
  allowDecimal: true,
})

const parse = (inputValue: string) => {
  return inputValue.split(/\s/).join("").replace(suffixPercent, "")
}

const digitRegExp = /\d/
const anyNonWhitespaceRegExp = /[^\s]/

// because designer don't want to block any char…
const trickyMaskNumberToAllowAnyChar = (mask: (value: string) => Array<string | RegExp>) => (value: string) => {
  const valueOnlyNum = value.replace(/_/g, "").replace(/%/g, "").replace(/[^\s]/g, "1")

  const rawMaskArray = mask(valueOnlyNum)

  const transformedMaskArray = rawMaskArray.map((char: any) => {
    return char.source && char.source === digitRegExp.source ? anyNonWhitespaceRegExp : char
  })

  return transformedMaskArray
}

interface CellInputProps {
  theme: "women" | "men"
  label?: string
  placeholder?: string
  field: FieldRenderProps<string, HTMLInputElement>
  mask?: "number" | "percent"
}

const CellInput: FunctionComponent<CellInputProps> = ({
  theme,
  label,
  field: {
    input: { value, onChange, ...inputProps },
    meta,
  },
  mask,
  placeholder,
}) => {
  const error = hasFieldError(meta)

  const maskToUse = mask === "percent" ? percentNumberMask : numberMask

  const maskWithAnyChar = trickyMaskNumberToAllowAnyChar(maskToUse)

  const inputValue = conformToMask(value, maskWithAnyChar(value), {}).conformedValue

  return (
    <FormControl isInvalid={error}>
      {label && (
        <FormLabel htmlFor={inputProps.name} position="absolute">
          <VisuallyHidden>{label}</VisuallyHidden>
        </FormLabel>
      )}
      <InputGroup>
        <InputLeftElement pointerEvents="none" width="6" height="8">
          {theme === "women" ? (
            <IconFemale color={error ? "red.500" : "women"} />
          ) : (
            <IconMale color={error ? "red.500" : "men"} />
          )}
        </InputLeftElement>
        {mask ? (
          <Input
            id={inputProps.name}
            placeholder={placeholder}
            pl={6}
            pr={1.5}
            as={MaskedInput}
            mask={maskWithAnyChar}
            size="sm"
            autoComplete="off"
            value={inputValue}
            borderColor={theme}
            onChange={(event) =>
              onChange({
                target: {
                  value: parse(event.target.value),
                },
              })
            }
            {...inputProps}
          />
        ) : (
          <Input
            placeholder={placeholder}
            pl={6}
            pr={1.5}
            size="sm"
            autoComplete="off"
            value={value}
            onChange={onChange}
            {...inputProps}
          />
        )}
      </InputGroup>
    </FormControl>
  )
}
export default CellInput
