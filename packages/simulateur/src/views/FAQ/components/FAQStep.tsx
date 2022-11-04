import React, { PropsWithChildren, ReactNode } from "react"
import { Box, Flex } from "@chakra-ui/react"
import IconBulletWrapper, { IconBulletWrapperProps } from "../../../components/ds/IconBulletWrapper"

export type FAQStepProp = PropsWithChildren<{ icon: ReactNode } & IconBulletWrapperProps>

const FAQStep = ({ children, icon, isValid }: FAQStepProp) => (
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
