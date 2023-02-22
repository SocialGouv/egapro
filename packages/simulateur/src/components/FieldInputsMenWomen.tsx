import React, { FunctionComponent } from "react"
import { Box, Grid, GridItem, Input, Text } from "@chakra-ui/react"
import { useField } from "react-final-form"

import { displayPercent, displayInt } from "../utils/helpers"
import { ValidatorFunction } from "../utils/formHelpers"

import CellInput from "./CellInput"

const displayReadOnlyValue = (value: string, mask?: "number" | "percent") => {
  if (!mask || !value) {
    return value
  }
  return mask === "percent" ? displayPercent(Number(value), 2) : displayInt(Number(value))
}

interface FieldInputsMenWomenProps {
  readOnly: boolean
  legend?: string
  title: string
  label: { men: string; women: string }
  calculable: boolean
  calculableNumber: number
  mask?: "number" | "percent"
  femmeFieldName: string
  hommeFieldName: string
  validatorFemmes?: ValidatorFunction
  validatorHommes?: ValidatorFunction
}

const FieldInputsMenWomen: FunctionComponent<FieldInputsMenWomenProps> = ({
  legend,
  title,
  label,
  readOnly,
  calculable,
  calculableNumber,
  mask,
  femmeFieldName,
  hommeFieldName,
  validatorFemmes,
  validatorHommes,
}) => {
  const femmesField = useField(femmeFieldName, {
    validate: calculable ? validatorFemmes : undefined,
  })
  const hommesField = useField(hommeFieldName, {
    validate: calculable ? validatorHommes : undefined,
  })

  const femmesError = femmesField.meta.touched && femmesField.meta.error
  const hommesError = hommesField.meta.touched && hommesField.meta.error
  const error = femmesError || hommesError

  return (
    <Grid
      templateColumns="1fr 5.5rem 5.5rem"
      gap={2}
      p={2}
      borderRadius="md"
      alignItems="center"
      border="1px solid"
      borderColor={
        femmesField.meta.valid && hommesField.meta.valid
          ? calculable
            ? "gray.200"
            : "primary.100"
          : error
          ? "red.100"
          : "gray.200"
      }
      bg={
        femmesField.meta.valid && hommesField.meta.valid
          ? calculable
            ? "transparent"
            : "primary.100"
          : error
          ? "red.50"
          : "transparent"
      }
    >
      <GridItem>
        <Box
          lineHeight={1.125}
          color={femmesField.meta.valid && hommesField.meta.valid ? "gray.600" : error ? "red.600" : "gray.600"}
        >
          {legend && (
            <>
              <Box as="span" fontSize="xs">
                {legend}
              </Box>
              <br />
            </>
          )}
          <Box as="span" fontSize="sm" fontWeight="semibold">
            {title}
          </Box>
        </Box>
      </GridItem>
      {readOnly ? (
        <>
          <GridItem textAlign="right">
            <Input as={Box} isReadOnly py={2} sx={{ borderColor: "transparent !important" }} size="sm" lineHeight="1">
              {displayReadOnlyValue(femmesField.input.value, mask)}
            </Input>
          </GridItem>
          <GridItem textAlign="right">
            <Input as={Box} isReadOnly py={2} sx={{ borderColor: "transparent !important" }} size="sm" lineHeight="1">
              {displayReadOnlyValue(hommesField.input.value, mask)}
            </Input>
          </GridItem>
        </>
      ) : calculable ? (
        <>
          <GridItem>
            <CellInput field={femmesField} mask={mask} placeholder="Femmes" theme="women" label={label.women} />
          </GridItem>
          <GridItem>
            <CellInput field={hommesField} mask={mask} placeholder="Hommes" theme="men" label={label.men} />
          </GridItem>
        </>
      ) : (
        <GridItem colSpan={2} />
      )}
      {calculable && error && (
        <GridItem colSpan={3}>
          <Text color="red.600" fontSize="sm">
            {error}
          </Text>
        </GridItem>
      )}
      {!calculable && (
        <GridItem colSpan={3}>
          <Text fontSize="xs">
            Le groupe ne peut pas être pris en compte pour le calcul car il comporte moins de {calculableNumber} femmes
            ou {calculableNumber} hommes.
          </Text>
        </GridItem>
      )}
    </Grid>
  )
}

export default FieldInputsMenWomen
