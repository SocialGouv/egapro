import React, { PropsWithChildren } from "react"
import { Box, Grid, GridItem, VStack, Text } from "@chakra-ui/react"

export type BlocFormProps = PropsWithChildren<{
  title?: string
  label?: string
  footer?: string | [string, string]
}>

const BlocForm = ({ title, label, footer, children }: BlocFormProps) => {
  return (
    <Box position="relative" bg="white" p={4} borderRadius="lg" borderWidth="1px">
      <Text fontWeight="semibold" lineHeight="tight" textTransform="uppercase" fontSize="sm" mb={4}>
        {title}
      </Text>
      <VStack spacing={2} align="stretch" mt={2}>
        {children}
      </VStack>
      {footer && (
        <Grid templateColumns="1fr 5.5rem 5.5rem" gap={2} mt={4} textAlign="right" fontSize="sm">
          <GridItem pr={2}>Total&nbsp;:</GridItem>
          {typeof footer === "string" ? (
            <GridItem colSpan={2}>{footer}</GridItem>
          ) : (
            <>
              <GridItem pr={5}>
                <Text fontWeight="semibold" noOfLines={1} lineHeight="1" mt={1}>
                  {footer[0]}
                </Text>
                <Text fontSize="xs" color="women">
                  Femmes
                </Text>
              </GridItem>
              <GridItem pr={5}>
                <Text fontWeight="semibold" noOfLines={1} lineHeight="1" mt={1}>
                  {footer[1]}
                </Text>
                <Text fontSize="xs" color="men">
                  Hommes
                </Text>
              </GridItem>
            </>
          )}
        </Grid>
      )}
    </Box>
  )
}

export const BlocFormLight = ({ children }: PropsWithChildren) => {
  return (
    <Box position="relative">
      <div>
        <div>{children}</div>
      </div>
    </Box>
  )
}

export default BlocForm
