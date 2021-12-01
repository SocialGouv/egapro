import { AlertMessageType } from "../../globals"
import { useToastMessage } from "../../utils/hooks"

/**
 * Composant sans vue qui peut afficher un toast en overlay quand un message est renseigné.
 *
 * See useToastMessage for usage outside a render of a component.
 */
function Toast({ message }: { message: AlertMessageType }) {
  const { toastMessage } = useToastMessage()

  if (message) toastMessage(message)

  return null
}

export default Toast
