import React, { useState, ReactNode, FunctionComponent } from "react"
import { Alert, AlertIcon, AlertTitle, Box, AlertDescription, CloseButton } from "@chakra-ui/react"

interface InfoBlocProps {
  type?: "error" | "success" | "warning" | "info"
  title: string
  text?: ReactNode
  closeButton?: boolean
}

const InfoBloc: FunctionComponent<InfoBlocProps> = ({ type = "info", title, text, closeButton = false }) => {
  const [isBlocVisible, setIsBlocVisible] = useState(true)
  const discardBloc = () => setIsBlocVisible(false)

  if (isBlocVisible) {
    return (
      <Alert status={type} borderRadius="md" p={4} sx={{ boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.05)" }}>
        <AlertIcon />
        <Box>
          <AlertTitle lineHeight={1.25}>{title}</AlertTitle>
          {text && (
            <AlertDescription fontSize="sm" lineHeight={1.25} display="block" mt={1}>
              {text}
            </AlertDescription>
          )}
        </Box>
        {closeButton && <CloseButton onClick={discardBloc} position="absolute" right="8px" top="8px" />}
      </Alert>
    )
  }
  return null
}

export default InfoBloc
