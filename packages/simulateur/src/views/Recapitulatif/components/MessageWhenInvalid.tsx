import React, { PropsWithChildren } from "react"

import { Text } from "@chakra-ui/react"

import InfoBlock from "../../../components/ds/InfoBlock"
import { TextSimulatorLink } from "../../../components/SimulatorLink"
import { indicateursInfo } from "../../../config"

export type MessageWhenInvalidProps = PropsWithChildren<{
  indicateur: keyof typeof indicateursInfo
}>

const MessageWhenInvalid = ({ indicateur }: MessageWhenInvalidProps) => {
  return (
    <InfoBlock
      type="warning"
      title={indicateursInfo[indicateur].title}
      text={
        <>
          <Text>
            L’indicateur ne peut être calculé car vous n’avez pas validé les informations nécessaires à son calcul.
          </Text>
          <Text mt={1}>
            <TextSimulatorLink to={`/${indicateur}`} label="Valider les informations" />
          </Text>
        </>
      }
    />
  )
}

export default MessageWhenInvalid
