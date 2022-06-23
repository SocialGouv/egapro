import React, { FunctionComponent } from "react"

import ResultSummary, { ResultSummaryProps } from "../../../components/ResultSummary"
import { Grid, GridItem, Heading } from "@chakra-ui/react"

interface RecapBlocProps {
  title: string
  resultSummary: ResultSummaryProps
}

const RecapBloc: FunctionComponent<RecapBlocProps> = ({ title, children, resultSummary }) => {
  return (
    <Grid
      templateColumns={{ sm: "1fr", md: "1fr 240px" }}
      gap={6}
      bg="gray.50"
      p={4}
      borderRadius="md"
      border="1px"
      borderColor="gray.200"
    >
      <GridItem>
        <Heading as="h2" fontSize="xl" mb={children ? 6 : 2} mt={2}>
          {title}
        </Heading>
        {children}
      </GridItem>
      <GridItem>
        <ResultSummary {...resultSummary} />
      </GridItem>
    </Grid>
  )
}

export default RecapBloc
