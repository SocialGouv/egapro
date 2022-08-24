import React, { FunctionComponent } from "react"
import { useState, ReactNode } from "react"
import { Box, VStack, StackDivider, Text } from "@chakra-ui/react"

import FAQSearchBox from "./components/FAQSearchBox"
import FAQQuestionRow from "./components/FAQQuestionRow"
import FAQTitle2 from "./components/FAQTitle2"

import faqDataFuse from "./utils/faqFuse"

interface FAQSearchProps {
  children: ReactNode
}

const FAQSearch: FunctionComponent<FAQSearchProps> = ({ children }) => {
  const [searchTerm, setSearchTerm] = useState("")

  const fuseResults = searchTerm !== "" ? faqDataFuse.search(searchTerm) : null

  return (
    <React.Fragment>
      <FAQSearchBox searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
      <Box mt={4}>
        {searchTerm === "" ? (
          children
        ) : (
          <VStack spacing={4} divider={<StackDivider borderColor="gray.100" />}>
            {fuseResults &&
              fuseResults.map(({ item: { part, title, index, question } }) => (
                <Box key={part + index}>
                  <FAQTitle2 mb={1}>{title}</FAQTitle2>
                  <FAQQuestionRow part={part} index={index} question={question} />
                </Box>
              ))}
          </VStack>
        )}
        {searchTerm !== "" && fuseResults?.length === 0 && <Text fontSize="sm">Aucun résultat trouvé</Text>}
      </Box>
    </React.Fragment>
  )
}

export default FAQSearch
