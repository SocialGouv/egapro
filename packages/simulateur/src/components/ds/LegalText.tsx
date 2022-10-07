import React, { PropsWithChildren } from "react"
import { Text } from "@chakra-ui/react"

const LegalText = ({ children }: PropsWithChildren) => (
  <Text fontStyle="italic" fontSize="sm">
    {children}
  </Text>
)

export default LegalText
