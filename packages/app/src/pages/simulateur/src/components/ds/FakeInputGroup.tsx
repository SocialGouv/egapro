import React, { FunctionComponent } from "react"
import { FormLabel, Input, Box, Text } from "@chakra-ui/react"

export type FakeInputGroupProps = {
  label: string
  message?: string | React.ReactElement
  textAlign?: "left" | "center" | "right"
}

const FakeInputGroup: FunctionComponent<FakeInputGroupProps> = ({ label, children, message, textAlign }) => {
  return (
    <Box>
      <FormLabel as="div">{label}</FormLabel>
      <Input as={Box} isReadOnly py={2} sx={{ borderColor: "transparent !important" }}>
        <Text noOfLines={1} {...(textAlign && { textAlign })}>
          {children}
        </Text>
      </Input>
      {message && (
        <Text fontSize="sm" mt={2} color="gray.500" lineHeight="4">
          {message}
        </Text>
      )}
    </Box>
  )
}

export default FakeInputGroup
