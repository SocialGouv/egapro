import React, { FunctionComponent, ReactNode } from "react"
import { Box, Grid, GridItem } from "@chakra-ui/react"

interface LayoutFormAndResultProps {
  childrenForm: ReactNode
  childrenResult: ReactNode
}

const LayoutFormAndResult: FunctionComponent<LayoutFormAndResultProps> = ({ childrenForm, childrenResult }) => {
  return (
    <Grid templateColumns={{ base: "1fr", md: "1fr 240px" }} gap={6}>
      <GridItem w="100%">{childrenForm}</GridItem>
      <GridItem w="100%">
        <Box sx={{ position: "sticky", top: 6 }}>{childrenResult}</Box>
      </GridItem>
    </Grid>
  )
}

export default LayoutFormAndResult
