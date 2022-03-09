import React, { ReactElement, FunctionComponent } from "react"
import {
  Modal as ModalChakra,
  ModalProps as ModalChakraProps,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
} from "@chakra-ui/react"

type ModalProps = ModalChakraProps & {
  title: string
  footer?: ReactElement
}

const Modal: FunctionComponent<ModalProps> = ({ children, title, footer, ...rest }) => {
  return (
    <ModalChakra size="xl" {...rest}>
      <ModalOverlay bg="blackAlpha.700" />
      <ModalContent>
        <ModalHeader>{title}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>{children}</ModalBody>
        {footer && (
          <ModalFooter justifyContent="start" gap="4">
            {footer}
          </ModalFooter>
        )}
      </ModalContent>
    </ModalChakra>
  )
}

export default Modal
