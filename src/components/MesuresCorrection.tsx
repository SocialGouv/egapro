import React, { Fragment, FunctionComponent } from "react"
import { Field } from "react-final-form"

import { required } from "../utils/formHelpers"
import { FormControl, FormLabel, Select, FormErrorMessage } from "@chakra-ui/react"
import FakeInputGroup from "./ds/FakeInputGroup"

const choices: { [key: string]: string } = {
  mmo: "Mesures mises en œuvre",
  me: "Mesures envisagées",
  mne: "Mesures non envisagées",
}

type MesuresCorrectionProps = { name: string; label: string; readOnly: boolean }

const MesuresCorrection: FunctionComponent<MesuresCorrectionProps> = ({ name, label, readOnly }) => {
  return (
    <Field name={name} validate={required} component="select">
      {({ input, meta }) => (
        <Fragment>
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
        </Fragment>
      )}
    </Field>
  )
}

export default MesuresCorrection
