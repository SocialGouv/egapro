import React, { FunctionComponent } from "react"

import SelectGroup from "./ds/SelectGroup"

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
    <SelectGroup
      fieldName={name}
      options={yearList}
      optionLabel="Choisir une année"
      label={label}
      isReadOnly={readOnly}
      message={{ error: "Veuillez sélectionner une année de déclaration dans la liste" }}
    />
  )
}

export default AnneeDeclaration
