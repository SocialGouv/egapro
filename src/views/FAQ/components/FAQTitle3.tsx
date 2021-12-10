import React, { FunctionComponent } from "react"
import { Heading, HeadingProps } from "@chakra-ui/react"

const FAQTitle3: FunctionComponent<HeadingProps> = ({ children, ...rest }) => (
  <Heading as="h5" fontSize="sm" color="gray.600" fontWeight="semibold" mt={4} mb={3} {...rest}>
    {children}
  </Heading>
)

export default FAQTitle3
