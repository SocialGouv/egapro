import React, { FunctionComponent, ReactElement } from "react"
import { Box } from "@chakra-ui/react"

export type SummaryProps = {
  colorScheme?: string
  footer?: ReactElement
}

const Summary: FunctionComponent<SummaryProps> = ({ children, footer, colorScheme = "white" }) => {
  return (
    <Box bg={colorScheme} p={4} borderRadius="lg" border="1px solid" borderColor="gray.200" shadow="lg">
      {children}
      {footer && (
        <Box mt={4} textAlign="center">
          {footer}
        </Box>
      )}
    </Box>
  )
}

export default Summary
