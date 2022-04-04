import React from "react"
import { Text, Heading, Link, UnorderedList, ListItem } from "@chakra-ui/react"

import { useTitle } from "../utils/hooks"

import Page from "../components/Page"

const title = "Mentions légales"

const MentionsLegales = () => {
  useTitle(title)

  return (
    <Page title={title}>
      <Heading as="h2" size="md" mb={3}>
        Éditeur de la plateforme
      </Heading>
      <Text>Index Egapro est édité par la Fabrique Numérique des Ministères sociaux.</Text>
      <UnorderedList mt={2} spacing={1}>
        <ListItem>Adresse&nbsp;: Tour Mirabeau, 39-43 Quai André Citroën 75015 PARIS</ListItem>
        <ListItem>Tél&nbsp;: 01 40 56 60 00</ListItem>
      </UnorderedList>
      <Heading as="h2" size="md" mb={3} mt={6}>
        Directeur de la publication
      </Heading>
      <Text>Directeur Général du Travail.</Text>
      <Heading as="h2" size="md" mb={3} mt={6}>
        Hébergement de la plateforme
      </Heading>
      <Text>
        Ce site est hébergé au&nbsp;:
        <br />
        Ministère des Affaires sociales et de la Santé
        <br />
        14 avenue Duquesne 75530 PARIS
      </Text>
      <Heading as="h2" size="md" mb={3} mt={6}>
        Accessibilité
      </Heading>
      <Text>
        La conformité aux normes d’accessibilité numérique est un objectif ultérieur mais nous tâchons de rendre ce site
        accessible à toutes et à tous.
      </Text>
      <Heading as="h3" size="sm" mb={2} mt={3}>
        Signaler un dysfonctionnement
      </Heading>
      <Text>
        Si vous rencontrez un défaut d’accessibilité vous empêchant d’accéder à un contenu ou une fonctionnalité du
        site, merci de nous en faire part.
        <br />
        Si vous n’obtenez pas de réponse rapide de notre part, vous êtes en droit de faire parvenir vos doléances ou une
        demande de saisine au Défenseur des droits.
      </Text>
      <Heading as="h3" size="sm" mb={2} mt={3}>
        En savoir plus
      </Heading>
      <Text>
        Pour en savoir plus sur la politique d’accessibilité numérique de l’État :<br />
        <Link href="http://references.modernisation.gouv.fr/accessibilite-numerique" isExternal color="primary.500">
          http://references.modernisation.gouv.fr/accessibilite-numerique
        </Link>
      </Text>
      <Heading as="h2" size="md" mb={3} mt={6}>
        Sécurité
      </Heading>
      <Text>
        Le site est protégé par un certificat électronique, matérialisé pour la grande majorité des navigateurs par un
        cadenas. Cette protection participe à la confidentialité des échanges. En aucun cas les services associés à la
        plateforme ne seront à l’origine d’envoi d'emails pour demander la saisie d’informations personnelles.
      </Text>
    </Page>
  )
}

export default MentionsLegales
