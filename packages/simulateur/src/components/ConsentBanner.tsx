import {
  Badge,
  Box,
  ButtonGroup,
  Divider,
  Flex,
  Heading,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Radio,
  RadioGroup,
  Spacer,
  Stack,
  Text,
  useDisclosure,
} from "@chakra-ui/react"
import { partition } from "lodash"
import React, { ElementType, PropsWithChildren, useRef, useState } from "react"
import { create } from "zustand"
import { persist } from "zustand/middleware"
import { immer } from "zustand/middleware/immer"
import { Any, TuplifyUnion, UnknownMapping } from "../utils/types"
import ButtonAction from "./ds/ButtonAction"

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface GdprServiceNames {}

export interface GdprService<T extends string> {
  description: string
  mandatory?: boolean
  name: T
  title: string
}

type Names = keyof GdprServiceNames
type NamesExtended = Names | UnknownMapping
type TupleNames = TuplifyUnion<Names>
type ServicesFromNames<T extends string[] = TupleNames> = T extends [string, ...string[]]
  ? { [K in keyof T]: GdprService<T[K]> }
  : Array<GdprService<string>>

interface UseGdprStore {
  consentModalButtonProps?: any
  consents: Partial<Record<NamesExtended, boolean>>
  firstChoiceMade: boolean
  modalButtonProps: { "aria-controls": "fr-consent-modal"; "data-fr-opened": "false" }
  setConsent(name: NamesExtended, consent: boolean): void
  setFirstChoiceMade: () => void
}

export const useGdprStore = create<UseGdprStore>()(
  persist(
    immer((set) => ({
      consents: {},
      firstChoiceMade: false,
      modalButtonProps: { "aria-controls": "fr-consent-modal", "data-fr-opened": "false" },
      setConsent(name, consent) {
        set((state) => {
          state.consents[name] = consent
        })
      },
      setFirstChoiceMade() {
        set((state) => {
          state.firstChoiceMade = true
        })
      },
    })),
    {
      name: "gdpr-consent",
    },
  ),
)

declare global {
  interface Window {
    openConsentModal?(): void
  }
}

export interface ConsentBannerProps {
  gdprPageLink: string
  gdprPageLinkAs?: ElementType<PropsWithChildren<{ href: Any }>> | string
  services: ServicesFromNames
  siteName: string
}

export const ConsentBanner = ({
  gdprPageLink,
  gdprPageLinkAs: GdprPageLinkAs = "a",
  siteName,
  services,
}: ConsentBannerProps) => {
  const setConsent = useGdprStore((state) => state.setConsent)
  const firstChoiceMade = useGdprStore((state) => state.firstChoiceMade)
  const setFirstChoiceMade = useGdprStore((state) => state.setFirstChoiceMade)
  const { isOpen, onClose, onOpen } = useDisclosure({ defaultIsOpen: !firstChoiceMade, id: "consent-modal" })
  window.openConsentModal = onOpen
  const consents = useGdprStore((state) => state.consents)
  const [accepted, setAccepted] = useState<string[]>([
    ...Object.entries(consents)
      .filter(([, consent]) => consent)
      .map(([name]) => name),
  ])
  const initialFocusRef = useRef(null)

  const accept = <T extends string>(service?: GdprService<T>) => {
    console.info("GDPR accept", service?.name ?? "all services")
    if (service && !service.mandatory && !accepted.includes(service.name)) {
      return setAccepted([...accepted, service.name])
    }

    const filtered = services.filter((service) => !service.mandatory).map((service) => service.name)
    setAccepted(Array.from(new Set([...filtered, ...accepted])))
  }

  const refuse = <T extends string>(service?: GdprService<T>) => {
    console.info("GDPR refuse", service?.name ?? "all services")
    if (service && !service.mandatory && accepted.includes(service.name))
      return setAccepted(accepted.filter((name) => service.name !== name))

    setAccepted([])
  }

  const confirm = () => {
    const [acceptedServices, refusedServices] = partition(services, (service) => accepted.includes(service.name))
    acceptedServices.forEach((service) => setConsent(service.name, true))
    refusedServices.forEach((service) => setConsent(service.name, false))
    setFirstChoiceMade()
    onClose()
  }

  return (
    <Modal
      isCentered
      motionPreset="slideInBottom"
      isOpen={isOpen}
      onClose={onClose}
      closeOnEsc={firstChoiceMade}
      closeOnOverlayClick={firstChoiceMade}
      initialFocusRef={initialFocusRef}
      size="2xl"
    >
      <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(10px)" />
      <ModalContent>
        <ModalHeader>À propos des cookies sur {siteName}</ModalHeader>
        {firstChoiceMade && <ModalCloseButton />}
        <ModalBody>
          <Text mb={4}>
            Bienvenue ! Nous utilisons des cookies pour améliorer votre expérience et les services disponibles sur ce
            site. Pour en savoir plus, visitez la page{" "}
            <GdprPageLinkAs href={gdprPageLink}>Données personnelles et cookies</GdprPageLinkAs>. Vous pouvez, à tout
            moment, avoir le contrôle sur les cookies que vous souhaitez activer.
          </Text>
          <Divider />
          <Flex my={4} alignItems="center">
            <Box>
              <Heading size="sm">Préférences pour tous les services</Heading>
            </Box>
            <Spacer />
            <ButtonGroup>
              <ButtonAction ref={initialFocusRef} label="Tout accepter" onClick={() => accept()} />
              <ButtonAction label="Tout refuser" variant="outline" onClick={() => refuse()} />
            </ButtonGroup>
          </Flex>
          <Divider />
          <Box>
            {services.map((service, index) => (
              <Flex key={`consent-service-${index}`} alignItems="center" my={2}>
                <Box>
                  <Heading size="sm">
                    {service.title}
                    {service.mandatory && (
                      <Badge ml="1" colorScheme="red">
                        Obligatoire
                      </Badge>
                    )}
                  </Heading>
                  <Text mt={1}>{service.description}</Text>
                </Box>
                <Spacer />
                <RadioGroup
                  isDisabled={service.mandatory}
                  onChange={(value) => (+value ? accept(service) : refuse(service))}
                  value={service.mandatory ? 1 : accepted.includes(service.name) ? 1 : 0}
                >
                  <Stack direction="row">
                    <Radio value={1}>Accepter</Radio>
                    <Radio value={0}>Refuser</Radio>
                  </Stack>
                </RadioGroup>
              </Flex>
            ))}
          </Box>
        </ModalBody>
        <ModalFooter>
          <ButtonAction label="Confirmer mes choix" onClick={() => confirm()} />
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
