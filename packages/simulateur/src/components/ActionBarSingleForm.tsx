import React, { FunctionComponent } from "react"
import ActionBar from "./ActionBar"
import ButtonAction from "./ds/ButtonAction"
import { IconEdit } from "./ds/Icons"
import FormSubmit from "./FormSubmit"
import { frozenDeclarationMessage } from "./MessageForFrozenDeclaration"
import { ButtonSimulatorLink } from "./SimulatorLink"

type Props = {
  readOnly: boolean
  to: string
  onClick: () => void
  frozenDeclaration: boolean
}

export const ActionBarSingleForm: FunctionComponent<Props> = ({ readOnly, to, onClick, frozenDeclaration }) => {
  return readOnly ? (
    <ActionBar>
      <ButtonSimulatorLink to={to} label="Suivant" />
      <ButtonAction
        leftIcon={<IconEdit />}
        label="Modifier les données saisies"
        onClick={onClick}
        variant="link"
        size="sm"
        disabled={frozenDeclaration}
        title={frozenDeclaration ? frozenDeclarationMessage : ""}
      />
    </ActionBar>
  ) : (
    <ActionBar>
      <FormSubmit />
    </ActionBar>
  )
}
