import React from "react"
import { Link } from "@chakra-ui/react"
import { IconExternalLink } from "./ds/Icons"

type Props = {
  siren?: string
  email: string
  children?: string
}

const MailtoLink: React.FC<Props> = ({ siren = "", email, children = "ici" }) => {
  return (
    <Link
      isExternal
      textDecoration="underline"
      href={`mailto:dgt.ega-pro@travail.gouv.fr?subject=EgaPro - Demander à être déclarant d'un Siren&body=Bonjour, je souhaite être déclarant pour le Siren ${siren}. Mon email de déclaration est ${email}. Cordialement.`}
    >
      {children}&nbsp;
      <IconExternalLink sx={{ transform: "translateY(.125rem)" }} />
    </Link>
  )
}

export default MailtoLink
