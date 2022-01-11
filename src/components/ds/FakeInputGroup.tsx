import React, { FunctionComponent } from "react"
import { FormLabel, Input, Box, Text } from "@chakra-ui/react"

export type FakeInputGroupProps = {
  label: string
}

const FakeInputGroup: FunctionComponent<FakeInputGroupProps> = ({ label, children }) => {
  return (
    <Box>
      <FormLabel as="div">{label}</FormLabel>
      <Input as={Box} isReadOnly py={2} sx={{ borderColor: "transparent !important" }}>
        <Text noOfLines={1}>{children}</Text>
      </Input>
    </Box>
  )
}

export default FakeInputGroup
