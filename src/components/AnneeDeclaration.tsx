import React, { FunctionComponent } from "react"
import { Field } from "react-final-form"

import { required } from "../utils/formHelpers"
import { Select, FormControl, FormErrorMessage, FormLabel } from "@chakra-ui/react"

type AnneeDeclarationProps = { name: string; label: string; readOnly: boolean }

const AnneeDeclaration: FunctionComponent<AnneeDeclarationProps> = ({ name, label, readOnly }) => {
  // TODO: ce code est correct mais peut prêter à confusion : les utilisateurs
  // peuvent croire qu'il faut mettre "2020" pour une déclaration en février
  // 2020, alors que leur période de référence se termine le 31 décembre 2019
  // (et donc l'année au titre de laquelle les indicateurs sont calculés devrait
  // être 2019). Cf https://github.com/SocialGouv/egapro/issues/503
  // const currentYear = new Date().getFullYear();
  // // 2018 est la première année pour laquelle il était possible de déclarer, et
  // // il est possible de déclarer jusqu'à l'année n.
  // const numYears = currentYear - 2018 + 1;
  // const yearList = Array(numYears)
  //   .fill(0)
  //   .map((_item, index) => Number(2018 + index).toString())
  //   .reverse();
  // TODO: supprimer cette ligne et repasser au code ci-dessus, ou alors
  // supprimer l'année au titre de laquelle les indicateurs sont calculés, et
  // utiliser l'année de la date de fin de la période de référence.
  const yearList = ["2020", "2019", "2018"]
  return (
    <Field name={name} validate={required} component="select">
      {({ input, meta }) => (
        <FormControl isInvalid={meta.error && meta.touched}>
          <FormLabel htmlFor={input.name}>{label}</FormLabel>
          <Select
            isReadOnly={readOnly}
            {...input}
            sx={{
              pointerEvents: readOnly ? "none" : "initial",
            }}
          >
            <option />
            {yearList.map((year: string) => (
              <option value={year} key={year}>
                {year}
              </option>
            ))}
          </Select>
          <FormErrorMessage>Veuillez sélectionner une année de déclaration dans la liste</FormErrorMessage>
        </FormControl>
      )}
    </Field>
  )
}

export default AnneeDeclaration
