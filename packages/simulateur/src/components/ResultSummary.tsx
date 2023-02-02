import React, { FunctionComponent } from "react"
import { Box, BoxProps, Table, TableCaption, Tbody, Td, Tr } from "@chakra-ui/react"

import ButtonAction from "./ds/ButtonAction"
import { IconEdit } from "./ds/Icons"
import Summary from "./Summary"
import { useAppStateContextProvider } from "../hooks/useAppStateContextProvider"
import { isFrozenDeclaration } from "../utils/isFrozenDeclaration"
import { frozenDeclarationMessage } from "./MessageForFrozenDeclaration"

export interface ResultSummaryProps {
  firstLineLabel: string
  firstLineData: string
  firstLineInfo?: string
  secondLineLabel: string
  secondLineData: string
  secondLineInfo?: string
  indicateurSexeSurRepresente?: "hommes" | "femmes" | undefined
  onEdit?: () => void
}

const Legend: FunctionComponent<BoxProps> = ({ children, ...rest }) => (
  <Box as="small" mt={1} {...rest}>
    {children}
  </Box>
)

const ResultSummary: FunctionComponent<ResultSummaryProps> = ({
  firstLineLabel,
  firstLineData,
  firstLineInfo,
  secondLineLabel,
  secondLineData,
  secondLineInfo,
  indicateurSexeSurRepresente,
  onEdit,
}) => {
  const { state } = useAppStateContextProvider()

  if (!state) return null

  const frozenDeclaration = isFrozenDeclaration(state)

  return (
    <Summary
      footer={
        onEdit && (
          <ButtonAction
            leftIcon={<IconEdit />}
            label="Modifier les informations"
            onClick={onEdit}
            size="sm"
            variant="outline"
            colorScheme="primary"
            disabled={frozenDeclaration}
            title={frozenDeclaration ? frozenDeclarationMessage : ""}
          />
        )
      }
    >
      <Table size="sm">
        <TableCaption placement="top" mt={0} pt={0} mb={1}>
          Récapitulatif
        </TableCaption>
        <Tbody>
          <Tr>
            <Td pl={0}>
              <Box>{firstLineLabel}</Box>
              {firstLineInfo && (
                <Legend
                  color={
                    (indicateurSexeSurRepresente === "femmes" && "women") ||
                    (indicateurSexeSurRepresente === "hommes" && "men") ||
                    "gray.500"
                  }
                >
                  {firstLineInfo}
                </Legend>
              )}
            </Td>
            <Td pr={0} isNumeric fontWeight="semibold">
              {firstLineData}
            </Td>
          </Tr>
          <Tr>
            <Td pl={0} border="none">
              <Box>{secondLineLabel}</Box>
              {secondLineInfo && <Legend color="gray.500">{secondLineInfo}</Legend>}
            </Td>
            <Td pr={0} pt={3} isNumeric fontWeight="semibold" border="none">
              {secondLineData}
            </Td>
          </Tr>
        </Tbody>
      </Table>
    </Summary>
  )
}

export default ResultSummary
