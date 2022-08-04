import React, { FunctionComponent } from "react"
import { Input, InputGroup, InputLeftElement, FormLabel, FormControl, VisuallyHidden } from "@chakra-ui/react"
import { IconSearch } from "../../../components/ds/Icons"

interface FAQSearchBoxProps {
  searchTerm: string
  setSearchTerm: (searchTerm: string) => void
}

const FAQSearchBox: FunctionComponent<FAQSearchBoxProps> = ({ searchTerm, setSearchTerm }) => {
  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(event.target.value)
  return (
    <FormControl>
      <FormLabel htmlFor="faq-search">
        <VisuallyHidden>Recherche par mot clef</VisuallyHidden>
      </FormLabel>
      <InputGroup>
        <InputLeftElement pointerEvents="none">
          <IconSearch color="primary.500" />
        </InputLeftElement>
        <Input
          id="faq-search"
          variant="outlinePrimary"
          type="search"
          value={searchTerm}
          onChange={onChange}
          placeholder="Cherchez par mot clef"
          data-hj-whitelist
        />
      </InputGroup>
    </FormControl>
  )
}

export default FAQSearchBox
