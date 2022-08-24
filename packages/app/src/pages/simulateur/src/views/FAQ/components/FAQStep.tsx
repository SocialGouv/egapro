import React, { FunctionComponent, ReactNode } from "react"
import { Box, Flex } from "@chakra-ui/react"
import IconBulletWrapper, { IconBulletWrapperProps } from "../../../components/ds/IconBulletWrapper"

type FAQStepProp = { children: ReactNode; icon: ReactNode } & IconBulletWrapperProps

const FAQStep: FunctionComponent<FAQStepProp> = ({ children, icon, isValid }) => (
  <Flex>
    <Box
      pt={4}
      sx={{
        position: "relative",
        marginRight: -6,
      }}
    >
      <IconBulletWrapper isValid={isValid}>{icon}</IconBulletWrapper>
    </Box>
    <Box bg="primary.100" pl={8} pr={6} py={4} borderRadius="md" fontSize="sm">
      {children}
    </Box>
  </Flex>
)

export default FAQStep
