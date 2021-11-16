import React from "react"
import { Button, ButtonProps } from "@chakra-ui/react"

function PrimaryButton({ children, ...rest }: ButtonProps) {
  return (
    <Button size="md" colorScheme="blue" mt="24px" {...rest}>
      {children}
    </Button>
  )
}

export default PrimaryButton
