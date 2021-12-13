import React, { FunctionComponent } from "react"
import { Box, BoxProps } from "@chakra-ui/react"
import { IconInvalid, IconValid } from "./Icons"

export type IconBulletWrapperProps = { isValid?: "valid" | "invalid" }

const IconBulletWrapper: FunctionComponent<BoxProps & IconBulletWrapperProps> = ({ children, isValid, ...rest }) => {
  return (
    <Box
      position="relative"
      height={12}
      width={12}
      border="1px solid"
      borderColor="primary.300"
      bg="white"
      borderRadius="50%"
      display="flex"
      justifyContent="center"
      alignItems="center"
      color={isValid ? (isValid === "valid" ? "green.600" : "red.600") : "primary.700"}
      sx={{
        svg: {
          width: 6,
          height: 6,
        },
      }}
      {...rest}
    >
      {isValid && (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          position="absolute"
          top={-1}
          left={-1}
          bg="white"
          borderRadius="50%"
          width={5}
          height={5}
          sx={{
            svg: {
              width: 4,
              height: 4,
            },
          }}
        >
          {isValid === "valid" && <IconValid color="green.500" />}
          {isValid === "invalid" && <IconInvalid color="red.500" />}
        </Box>
      )}

      {children}
    </Box>
  )
}

export default IconBulletWrapper
