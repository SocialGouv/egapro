import React from "react"
import { Text } from "@chakra-ui/react"

const LegalText: React.FC = ({ children }) => (
  <Text fontStyle="italic" fontSize="sm">
    {children}
  </Text>
)

export default LegalText
