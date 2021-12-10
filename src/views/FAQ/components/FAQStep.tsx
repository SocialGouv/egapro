import React, { FunctionComponent, ReactNode } from "react"
import { Box, Flex } from "@chakra-ui/react"

type FAQStepProp = { children: ReactNode; icon: ReactNode }

const FAQStep: FunctionComponent<FAQStepProp> = ({ children, icon }) => (
  <Flex>
    <Box
      pt={4}
      sx={{
        position: "relative",
        marginRight: "-22px",
      }}
    >
      {icon}
    </Box>
    <Box bg="primary.100" pl={8} pr={6} py={4} borderRadius="md" fontSize="sm">
      {children}
    </Box>
  </Flex>
)

export default FAQStep
