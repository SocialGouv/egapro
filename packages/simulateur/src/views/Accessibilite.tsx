import React, { FunctionComponent } from "react"
import { Text, Heading, Link, UnorderedList, ListItem } from "@chakra-ui/react"

import { useTitle } from "../utils/hooks"
import Page from "../components/Page"

const title = "Accessibilité"

const Accessibilite: FunctionComponent = () => {
  useTitle(title)

  return (
    <Page title={title}>
      <Heading as="h2" size="md" mb={3}>
        Déclaration d'accessibilité
      </Heading>
      <Text>
        Le Ministère du travail, de l'emploi et de l'insertion s'engage à rendre son service accessible conformément à
        l'article 47 de la loi n°&nbsp;2005-102 du 11 février 2005.
      </Text>
      <Text mt={2}>
        À cette fin, il met en œuvre la stratégie et l'action suivante&nbsp;: réalisation d'un audit de conformité à
        l'été de l'année 2021.
      </Text>
      <Text mt={2}>Cette déclaration d'accessibilité s'applique au site Internet index-egapro.travail.gouv.fr.</Text>
      <Heading as="h2" size="md" mb={3} mt={6}>
        État de conformité
      </Heading>
      <Text>
        Le site Internet index-egapro.travail.gouv.fr n'est pas encore en conformité avec le référentiel général
        d'amélioration de l'accessibilité (RGAA). Le site n'a pas encore été audité.
      </Text>
      <Text mt={2}>Nous tâchons de rendre dès la conception, ce site accessible à toutes et à tous.</Text>
      <Heading as="h2" size="md" mb={3} mt={6}>
        Résultat des tests
      </Heading>
      <Text>L'audit de conformité est en attente de réalisation (été de l'année 2021).</Text>
      <Heading as="h2" size="md" mb={3} mt={6}>
        Établissement de cette déclaration d'accessibilité
      </Heading>
      <Text>Cette déclaration a été établie le 1er juin 2021.</Text>
      <Heading as="h2" size="md" mb={3} mt={6}>
        Amélioration et contact
      </Heading>
      <Text>
        Si vous n'arrivez pas à accéder à un contenu ou à un service, vous pouvez contacter le responsable du site
        Internet index-egapro.travail.gouv.fr pour être orienté vers une alternative accessible ou obtenir le contenu
        sous une autre forme.
      </Text>
      <Text mt={2}>
        E-mail&nbsp;:{" "}
        <Link href="mailto:index@travail.gouv.fr" color="primary.500">
          index@travail.gouv.fr
        </Link>
      </Text>
      <Text>Nous essayons de répondre le plus rapidement possible.</Text>
      <Heading as="h2" size="md" mb={3} mt={6}>
        Voies de recours
      </Heading>
      <Text>Cette procédure est à utiliser dans le cas suivant.</Text>
      <Text mt={2}>
        Vous avez signalé au responsable du site internet un défaut d'accessibilité qui vous empêche d'accéder à un
        contenu ou à un des services du portail et vous n'avez pas obtenu de réponse satisfaisante.
      </Text>
      <Text mt={2}>Vous pouvez&nbsp;:</Text>
      <UnorderedList mt={2} spacing={1}>
        <ListItem>Écrire un message au Défenseur des droits</ListItem>
        <ListItem>Contacter le délégué du Défenseur des droits dans votre région</ListItem>
        <ListItem>
          Envoyer un courrier par la poste (gratuit, ne pas mettre de timbre)&nbsp;: <br />
          Défenseur des droits Libre réponse, 71120 75342 Paris CEDEX 07
        </ListItem>
      </UnorderedList>
      <Heading as="h2" size="md" mb={3} mt={6}>
        En savoir plus sur l'accessibilité
      </Heading>
      <Text>
        Pour en savoir plus sur la politique d'accessibilité numérique de l'État&nbsp;:
        <br />
        <Link href="http://references.modernisation.gouv.fr/accessibilite-numerique" isExternal color="primary.500">
          http://references.modernisation.gouv.fr/accessibilite-numerique
        </Link>
      </Text>
    </Page>
  )
}

export default Accessibilite
