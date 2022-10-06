import React, { PropsWithChildren } from "react"
import { Link } from "@chakra-ui/react"
import { IconExternalLink } from "./ds/Icons"

export type MailtoLinkProps = PropsWithChildren<{
  siren?: string
  email: string
}>

const MailtoLink = ({ siren = "", email, children = "ici" }: MailtoLinkProps) => {
  return (
    <Link
      isExternal
      textDecoration="underline"
      href={`mailto:dgt.ega-pro@travail.gouv.fr?subject=EgaPro - Demander à être déclarant d'un SIREN&body=Bonjour, je souhaite être déclarant pour le SIREN ${siren}. Mon email de déclaration est ${email}. Cordialement.`}
    >
      {children}&nbsp;
      <IconExternalLink sx={{ transform: "translateY(.125rem)" }} />
    </Link>
  )
}

export default MailtoLink
