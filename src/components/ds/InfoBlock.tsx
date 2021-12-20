import React, { ReactNode, FunctionComponent } from "react"
import { Alert, AlertIcon, AlertTitle, Box, AlertDescription, CloseButton, useBoolean } from "@chakra-ui/react"

interface InfoBlocProps {
  type?: "error" | "success" | "warning" | "info"
  title: string
  text?: ReactNode
  closeButton?: boolean
}

const InfoBlock: FunctionComponent<InfoBlocProps> = ({ type = "info", title, text, closeButton = false }) => {
  const [isBlockVisible, setIsBlockVisible] = useBoolean()

  if (isBlockVisible) {
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
        {closeButton && <CloseButton onClick={setIsBlockVisible.toggle} position="absolute" right="8px" top="8px" />}
      </Alert>
    )
  }
  return null
}

export default InfoBlock
