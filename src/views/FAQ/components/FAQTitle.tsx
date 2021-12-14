import React, { FunctionComponent } from "react"
import { Heading, HeadingProps } from "@chakra-ui/react"

const FAQTitle: FunctionComponent<HeadingProps> = ({ children, ...rest }) => (
  <Heading as="h3" fontSize="xl" color="primary.500" fontWeight="bold" {...rest}>
    {children}
  </Heading>
)

export default FAQTitle
