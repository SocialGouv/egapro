import { Table, TableCaption, Tbody, Td, Tr } from "@chakra-ui/react"
import React from "react"

import { FunctionComponent } from "react"
import { frozenDeclarationMessage } from "../../components/MessageForFrozenDeclaration"
import Summary from "../../components/Summary"
import ButtonAction from "../../components/ds/ButtonAction"
import { IconEdit } from "../../components/ds/Icons"
import { useAppStateContextProvider } from "../../hooks/useAppStateContextProvider"
import { isFrozenDeclaration } from "../../utils/isFrozenDeclaration"

interface EffectifResultProps {
  totalNombreSalariesHomme: number
  totalNombreSalariesFemme: number
  unsetEffectif: () => void
}

const EffectifResult: FunctionComponent<EffectifResultProps> = ({
  totalNombreSalariesHomme,
  totalNombreSalariesFemme,
  unsetEffectif,
}) => {
  const { state } = useAppStateContextProvider()

  if (!state) return null

  const frozenDeclaration = isFrozenDeclaration(state)

  return (
    <Summary
      footer={
        <ButtonAction
          leftIcon={<IconEdit />}
          label="Modifier les effectifs"
          onClick={() => unsetEffectif()}
          size="sm"
          variant="outline"
          colorScheme="primary"
          disabled={frozenDeclaration}
          title={frozenDeclaration ? frozenDeclarationMessage : ""}
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
