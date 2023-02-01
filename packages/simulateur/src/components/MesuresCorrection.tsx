import React, { FunctionComponent } from "react"
import { Field } from "react-final-form"

import { FormControl, FormErrorMessage, FormLabel, Select } from "@chakra-ui/react"
import { required } from "../utils/formHelpers"
import FakeInputGroup from "./ds/FakeInputGroup"

const choices: { [key: string]: string } = {
  mmo: "Mesures mises en œuvre",
  me: "Mesures envisagées",
  mne: "Mesures non envisagées",
}

type MesuresCorrectionProps = { readOnly: boolean }

const MesuresCorrection: FunctionComponent<MesuresCorrectionProps> = ({ readOnly }) => {
  const label = "Mesures de correction prévues à l'article D. 1142-6"

  return (
    <Field name="mesuresCorrection" validate={required} component="select">
      {({ input, meta }) => (
        <>
          {readOnly ? (
            <FakeInputGroup label={label}>{choices[input.value]}</FakeInputGroup>
          ) : (
            <FormControl isInvalid={meta.error && meta.touched}>
              <FormLabel>{label}</FormLabel>
              <Select {...input}>
                <option />
                {Object.keys(choices).map((value) => (
                  <option value={value} key={value}>
                    {choices[value]}
                  </option>
                ))}
              </Select>
              <FormErrorMessage>Veuillez sélectionner un choix dans la liste</FormErrorMessage>
            </FormControl>
          )}
        </>
      )}
    </Field>
  )
}

export default MesuresCorrection
