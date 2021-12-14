import React, { FunctionComponent } from "react"
import { Box, BoxProps, Flex } from "@chakra-ui/react"
import { IconInvalid, IconValid } from "./Icons"

export type IconBulletWrapperProps = { isValid?: "valid" | "invalid" }

const IconBulletWrapper: FunctionComponent<BoxProps & IconBulletWrapperProps> = ({ children, isValid, ...rest }) => {
  return (
    <Flex
      justifyContent="center"
      alignItems="center"
      position="relative"
      height={12}
      width={12}
      border="1px solid"
      borderColor="primary.300"
      bg="white"
      borderRadius="50%"
      color={isValid ? (isValid === "valid" ? "green.600" : "red.600") : "primary.700"}
      {...rest}
    >
      {isValid && (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          position="absolute"
          top={-0.5}
          left={-0.5}
          bg="white"
          borderRadius="50%"
          width={4}
          height={4}
        >
          {isValid === "valid" && <IconValid color="green.500" boxSize="4" />}
          {isValid === "invalid" && <IconInvalid color="red.500" boxSize="4" />}
        </Box>
      )}
      <Flex
        justifyContent="center"
        alignItems="center"
        sx={{
          svg: {
            width: 6,
            height: 6,
          },
        }}
      >
        {children}
      </Flex>
    </Flex>
  )
}

export default IconBulletWrapper
