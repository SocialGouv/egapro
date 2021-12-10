import React, { FunctionComponent } from "react"
import { Table, Thead, Tbody, Tr, Th, Td, Box } from "@chakra-ui/react"

interface FAQCalculScaleProps {
  listTitle: string
  list: Array<string>
  scaleTitle: string
  scale: Array<string>
}

const FAQCalculScale: FunctionComponent<FAQCalculScaleProps> = ({ listTitle, list, scaleTitle, scale }) => (
  <Box border="1px solid" borderColor="gray.200" borderRadius="md" overflowY="hidden" bg="white">
    <Table variant="striped" size="sm" marginBottom="-1px">
      <Thead>
        <Tr>
          <Th>{listTitle}</Th>
          <Th>{scaleTitle}</Th>
        </Tr>
      </Thead>
      <Tbody>
        {list.map((listEl, index) => (
          <Tr key={listEl}>
            <Td>{listEl}</Td>
            <Td>{scale[index]}</Td>
          </Tr>
        ))}
      </Tbody>
    </Table>
  </Box>
)

export default FAQCalculScale
