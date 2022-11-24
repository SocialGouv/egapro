import React, { PropsWithChildren } from "react"
import { FormLabel, Input, Box, Text } from "@chakra-ui/react"

export type FakeInputGroupProps = PropsWithChildren<{
  label: string
  message?: string | React.ReactElement
  textAlign?: "left" | "center" | "right"
  title?: string
}>

const FakeInputGroup = ({ label, children, message, textAlign, title }: FakeInputGroupProps) => {
  return (
    <Box title={title}>
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
