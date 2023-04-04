/** @jsx jsx */
import { css, jsx } from "@emotion/react"
import { ReactNode } from "react"
import { useField } from "react-final-form"
import { Flex, FormControl, FormLabel } from "@chakra-ui/react"

function RadioField({
  fieldName,
  label,
  value,
  choiceValue,
  disabled,
}: {
  fieldName: string
  label: ReactNode
  value: string
  choiceValue: string
  disabled: boolean
}) {
  const { input } = useField(fieldName, { type: "radio", value: choiceValue })
  return (
    <label css={[styles.label, value === choiceValue && styles.labelChecked, disabled && styles.labelDisabled]}>
      <input css={styles.radio} {...input} disabled={disabled} />
      <span css={styles.labelText}>{label}</span>
    </label>
  )
}

export type RadioLabelChoice = {
  label: string
  value: string
}

interface RadioLabelsProps {
  readOnly: boolean
  fieldName: string
  label: string
  value: string
  choices: RadioLabelChoice[]
}

const RadioLabels = ({ readOnly, fieldName, label, value, choices }: RadioLabelsProps) => {
  return (
    <FormControl>
      <FormLabel as="div">{label}</FormLabel>
      <Flex role="radiogroup">
        {choices.map(({ label: choiceLabel, value: choiceValue }) => (
          <RadioField
            key={choiceLabel}
            fieldName={fieldName}
            label={choiceLabel}
            value={value}
            choiceValue={choiceValue}
            disabled={readOnly}
          />
        ))}
      </Flex>
    </FormControl>
  )
}

const styles = {
  container: css({
    display: "flex",
    flexDirection: "column",
    fontSize: 14,
  }),
  radioField: css({
    display: "flex",
    marginTop: 5,
  }),
  inputLabel: css({
    fontSize: 14,
    fontWeight: "bold",
    lineHeight: "17px",
  }),
  label: css({
    backgroundColor: "#fff",
    flex: 1,
    fontSize: 14,
    cursor: "pointer",
    display: "inline-block",
    padding: "10px 20px",
    border: "solid #191a49 1px",
    borderRight: 0,
    textAlign: "center",
    "&:first-of-type": {
      borderRight: 0,
      borderRadius: "4px 0 0 4px",
    },
    "&:last-of-type": {
      borderRadius: "0 4px 4px 0",
      borderRight: "solid #191a49 1px",
    },
  }),
  labelChecked: css({
    backgroundColor: "#696CD1",
    color: "#fff",
  }),
  labelDisabled: css({
    border: 0,
    "&:last-of-type": {
      borderRight: 0,
    },
  }),
  labelText: css({
    lineHeight: "16px",
  }),
  radio: css({
    display: "none",
  }),
}

export default RadioLabels
