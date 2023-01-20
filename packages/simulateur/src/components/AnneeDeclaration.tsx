import React, { FunctionComponent } from "react"

import SelectGroup from "./ds/SelectGroup"

import { FIRST_YEAR_FOR_DECLARATION, LAST_YEAR_FOR_DECLARATION } from "../config"

interface AnneeDeclarationProps {
  name: string
  label: string
  readOnly?: boolean
}

const AnneeDeclaration: FunctionComponent<AnneeDeclarationProps> = ({ name, label, readOnly }) => {
  const numYears = LAST_YEAR_FOR_DECLARATION - FIRST_YEAR_FOR_DECLARATION + 1
  const yearList = Array(numYears)
    .fill(0)
    .map((_item, index) => Number(2018 + index).toString())
    .reverse()
  return (
    <SelectGroup
      fieldName={name}
      options={yearList}
      optionLabel="Choisir une année"
      label={label}
      isReadOnly={readOnly}
      message={{ error: "Ce champ ne peut être vide" }}
    />
  )
}

export default AnneeDeclaration
