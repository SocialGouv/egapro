import React from "react"
import { Button, ButtonProps } from "@chakra-ui/react"

function LinkButton({ children, ...rest }: ButtonProps) {
  return (
    <Button minW="110px" colorScheme="button.primary" variant="link" height="36px" borderRadius="5px" {...rest}>
      {children}
    </Button>
  )
}

export default LinkButton
