import React from "react"
import { Table, TableCaption, Tbody, Td, Tr } from "@chakra-ui/react"

import { FormState } from "../../globals"

import Summary from "../../components/Summary"
import { FunctionComponent } from "react"
import ButtonAction from "../../components/ds/ButtonAction"
import { IconEdit } from "../../components/ds/Icons"

interface EffectifResultProps {
  totalNombreSalariesHomme: number
  totalNombreSalariesFemme: number
  validateEffectif: (valid: FormState) => void
}

const EffectifResult: FunctionComponent<EffectifResultProps> = ({
  totalNombreSalariesHomme,
  totalNombreSalariesFemme,
  validateEffectif,
}) => {
  return (
    <Summary
      footer={
        <ButtonAction
          leftIcon={<IconEdit />}
          label="Modifier les effectifs"
          onClick={() => validateEffectif("None")}
          size="sm"
          variant="outline"
          colorScheme="primary"
        />
      }
    >
      <Table size="sm">
        <TableCaption placement="top" mt={0} pt={0} mb={1}>
          Récapitulatif
        </TableCaption>
        <Tbody>
          <Tr>
            <Td>Nombre de femmes</Td>
            <Td isNumeric fontWeight="semibold">
              {totalNombreSalariesFemme}
            </Td>
          </Tr>
          <Tr>
            <Td>Nombre d’hommes</Td>
            <Td isNumeric fontWeight="semibold">
              {totalNombreSalariesHomme}
            </Td>
          </Tr>
          <Tr>
            <Td pt={3} border="none">
              Total effectifs
            </Td>
            <Td pt={3} isNumeric fontWeight="semibold" border="none">
              {totalNombreSalariesFemme + totalNombreSalariesHomme}
            </Td>
          </Tr>
        </Tbody>
      </Table>
    </Summary>
  )
}

export default EffectifResult
