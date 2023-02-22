import { Grid, GridItem } from "@chakra-ui/react"
import React, { FunctionComponent, ReactNode } from "react"

interface LayoutFormProps {
  form: ReactNode
  result?: ReactNode
}

const LayoutForm: FunctionComponent<LayoutFormProps> = ({ form }) => {
  return (
    <Grid templateColumns={{ base: "1fr", md: "1fr" }} gap={6}>
      <GridItem w="100%">{form}</GridItem>
    </Grid>
  )
}

export default LayoutForm
