import React, { FunctionComponent, ReactNode } from "react"
import { Box, Grid, GridItem } from "@chakra-ui/react"

interface LayoutFormAndResultProps {
  form: ReactNode
  result?: ReactNode
}

const LayoutFormAndResult: FunctionComponent<LayoutFormAndResultProps> = ({ form, result = null }) => {
  if (result) {
    return (
      <Grid templateColumns={{ base: "1fr", md: "1fr 240px" }} gap={6}>
        <GridItem w="100%">{form}</GridItem>
        <GridItem w="100%">
          <Box sx={{ position: "sticky", top: 6 }}>{result}</Box>
        </GridItem>
      </Grid>
    )
  } else {
    return (
      <Grid templateColumns={{ base: "1fr", md: "1fr" }} gap={6}>
        <GridItem w="100%">{form}</GridItem>
      </Grid>
    )
  }
}

export default LayoutFormAndResult
