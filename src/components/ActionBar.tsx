import React, { FunctionComponent } from "react"
import { HStack, StackProps } from "@chakra-ui/react"

type ActionBarProps = StackProps

const ActionBar: FunctionComponent<ActionBarProps> = ({ children, ...rest }) => {
  return (
    <HStack
      spacing={6}
      mt={12}
      sx={{
        "@media print": {
          display: "none",
        },
      }}
      {...rest}
    >
      {children}
    </HStack>
  )
}

export default ActionBar
