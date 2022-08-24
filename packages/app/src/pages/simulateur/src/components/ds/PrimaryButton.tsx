import React from "react"
import { Button, ButtonProps } from "@chakra-ui/react"

function PrimaryButton({ children, ...rest }: ButtonProps) {
  return (
    <Button minW="110px" colorScheme="primary" border="1px" height="40px" borderRadius="5px" {...rest}>
      {children}
    </Button>
  )
}

export default PrimaryButton
