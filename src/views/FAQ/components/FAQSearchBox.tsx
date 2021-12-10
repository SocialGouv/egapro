import React, { FunctionComponent } from "react"
import { RiSearchLine } from "react-icons/ri"
import { Input, InputGroup, InputLeftElement, FormLabel, FormControl, VisuallyHidden, Icon } from "@chakra-ui/react"

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
          <Icon as={RiSearchLine} color="primary.500" aria-hidden="true" />
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
