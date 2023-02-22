import React from "react"
import { useAppStateContextProvider } from "../hooks/useAppStateContextProvider"
import { isFrozenDeclaration } from "../utils/isFrozenDeclaration"
import InfoBlock from "./ds/InfoBlock"

export const frozenDeclarationMessage =
  "Cette simulation-déclaration n'est plus modifiable car le délai d'un an est écoulé."

export const MessageForFrozenDeclaration = () => {
  const { state } = useAppStateContextProvider()

  if (!state) return null

  const frozenDeclaration = isFrozenDeclaration(state)

  if (!frozenDeclaration) return null

  return (
    <InfoBlock
      type="warning"
      title="Votre simulation-déclaration n'est plus modifiable"
      text="Cette simulation a donné lieu à une déclaration validée et transmise. Elle n'est plus modifiable car le délai d'un an est écoulé."
      my="6"
    />
  )
}
