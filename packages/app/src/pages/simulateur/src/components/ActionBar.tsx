import React, { FunctionComponent } from "react"
import { Stack, StackProps } from "@chakra-ui/react"

type ActionBarProps = StackProps

const ActionBar: FunctionComponent<ActionBarProps> = ({ children, ...rest }) => {
  return (
    <Stack
      spacing={{ base: 4, sm: 6 }}
      direction={{ base: "column", sm: "row" }}
      mt={12}
      sx={{
        "@media print": {
          display: "none",
        },
      }}
      {...rest}
    >
      {children}
    </Stack>
  )
}

export default ActionBar
