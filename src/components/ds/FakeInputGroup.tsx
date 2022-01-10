import React, { FunctionComponent } from "react"
import { FormLabel, Input } from "@chakra-ui/react"

export type FakeInputGroupProps = {
  label: string
}

const FakeInputGroup: FunctionComponent<FakeInputGroupProps> = ({ label, children }) => {
  return (
    <div>
      <FormLabel as="div">{label}</FormLabel>
      <Input as="div" isReadOnly py={2}>
        {children}
      </Input>
    </div>
  )
}

export default FakeInputGroup
