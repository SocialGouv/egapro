/** @jsx jsx */
import { css, jsx } from "@emotion/react"
import MaskedInput, { conformToMask } from "react-text-mask"
import createNumberMask from "text-mask-addons/dist/createNumberMask"
import { FieldRenderProps, FieldMetaState } from "react-final-form"

import globalStyles from "../utils/globalStyles"

import { Cell } from "./Cell"

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

interface Props {
  field: FieldRenderProps<string, HTMLInputElement>
  mask?: "number" | "percent" | undefined
  style?: any
}

function CellInput({
  field: {
    input: { value, onChange, ...inputProps },
    meta,
  },
  mask,
  style,
}: Props) {
  const error = hasFieldError(meta)

  const maskToUse = mask === "percent" ? percentNumberMask : numberMask

  const maskWithAnyChar = trickyMaskNumberToAllowAnyChar(maskToUse)

  const inputValue = conformToMask(value, maskWithAnyChar(value), {}).conformedValue

  return (
    <Cell style={styles.cell}>
      {mask ? (
        // @ts-ignore
        <MaskedInput
          mask={maskWithAnyChar}
          css={[styles.input, style, error && styles.inputError]}
          autoComplete="off"
          value={inputValue}
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
        <input
          css={[styles.input, style, error && styles.inputError]}
          autoComplete="off"
          value={value}
          onChange={onChange}
          {...inputProps}
        />
      )}
    </Cell>
  )
}

const styles = {
  cell: css({
    height: 22,
    display: "flex",
  }),
  input: css({
    appearance: "none",
    border: `solid ${globalStyles.colors.default} 1px`,
    width: "100%",
    fontSize: 14,
    textAlign: "center",
  }),
  inputError: css({
    color: globalStyles.colors.error,
    borderColor: globalStyles.colors.error,
  }),
}

export default CellInput
