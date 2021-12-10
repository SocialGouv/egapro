import React, { FunctionComponent } from "react"
import { Box, BoxProps } from "@chakra-ui/react"

const IconBulletWrapper: FunctionComponent<BoxProps> = ({ children, ...rest }) => {
  return (
    <Box
      height={12}
      width={12}
      border="1px solid"
      borderColor="primary.300"
      bg="white"
      borderRadius="50%"
      display="flex"
      justifyContent="center"
      alignItems="center"
      {...rest}
    >
      {children}
    </Box>
  )
}

export default IconBulletWrapper
