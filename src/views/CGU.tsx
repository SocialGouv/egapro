import React, { FunctionComponent } from "react"
import { Text, Heading, Link } from "@chakra-ui/react"

import { useTitle } from "../utils/hooks"

import Page from "../components/Page"

const title = "Conditions d'utilisation"

const CGU: FunctionComponent = () => {
  useTitle(title)

  return (
    <Page title={title}>
      <Text>
        Les présentes conditions générales d'utilisation (dites « CGU ») fixent le cadre juridique de la Plateforme
        Index Egapro et définissent les conditions d'accès et d'utilisation des services par l'Utilisateur.
      </Text>
      <Heading as="h2" size="md" mb={3} mt={6}>
        Champ d'application
      </Heading>
      <Text>
        La Plateforme est d'accès libre et gratuit à tout Utilisateur. La simple visite de la Plateforme suppose
        l'acceptation par tout Utilisateur des présentes conditions générales d'utilisation.
      </Text>
      <Text mt={2}>
        L'inscription sur la Plateforme peut entraîner l'application de conditions spécifiques, listées dans les
        présentes Conditions d'Utilisation
      </Text>
      <Heading as="h2" size="md" mb={3} mt={6}>
        Objet
      </Heading>
      <Text>
        Index Egapro entend faire progresser au sein des entreprises l'égalité salariale entre les femmes et les hommes.
        Il permet aux entreprises de mesurer, en toute transparence, les écarts de rémunération entre les sexes et de
        mettre en évidence leurs points de progression.
      </Text>
      <Heading as="h2" size="md" mb={3} mt={6}>
        Fonctionnalités
      </Heading>
      <Text>
        Index Egapro a mis en place un simulateur en ligne grâce auquel tout utilisateur, sans se créer de compte, peut
        remplir des informations concernant son entreprise afin de calculer son Index et connaître les écarts de salaire
        entre hommes et femmes au sein de sa structure. Dans le cadre du remplissage de ce formulaire, l'utilisateur a
        la possibilité de renseigner son adresse email afin d'enregistrer les données fournies et de continuer son
        calcul et sa déclaration plus tard.
      </Text>
      <Text mt={2}>
        Index Egapro propose également un formulaire de déclaration de cet Index afin qu'il soit transmis au Ministère
        du Travail. La plateforme propose également une FAQ et un moteur de recherche. Le code du logiciel est libre, et
        peut donc être vérifié et amélioré par tous&nbsp;:{" "}
        <Link href="https://github.com/SocialGouv/egapro/" isExternal color="primary.500">
          https://github.com/SocialGouv/egapro/
        </Link>
      </Text>
      <Heading as="h2" size="md" mb={3} mt={6}>
        Responsabilités
      </Heading>
      <Heading as="h3" size="sm" mb={3} mt={4}>
        Index Egapro
      </Heading>
      <Text>
        Les sources des informations diffusées sur la Plateforme sont réputées fiables mais le site ne garantit pas
        qu'il soit exempt de défauts, d'erreurs ou d'omissions.
      </Text>
      <Text mt={2}>
        Tout événement dû à un cas de force majeure ayant pour conséquence un dysfonctionnement de la Plateforme et sous
        réserve de toute interruption ou modification en cas de maintenance, n'engage pas la responsabilité de Index
        Egapro.
      </Text>
      <Text mt={2}>
        L'éditeur s'engage à mettre en œuvre toutes mesures appropriées, afin de protéger les données traitées.
      </Text>
      <Text mt={2}>
        L'éditeur s'engage à la sécurisation de la Plateforme, notamment en prenant toutes les mesures nécessaires
        permettant de garantir la sécurité et la confidentialité des informations fournies.
      </Text>
      <Text mt={2}>
        L'éditeur fournit les moyens nécessaires et raisonnables pour assurer un accès continu, sans contrepartie
        financière, à la Plateforme. Il se réserve la liberté de faire évoluer, de modifier ou de suspendre, sans
        préavis, la plateforme pour des raisons de maintenance ou pour tout autre motif jugé nécessaire.
      </Text>
      <Text mt={2}>
        Ce site peut mettre à disposition des liens pouvant orienter l'utilisateur vers des sites réalisés par des tiers
        extérieurs. Ces tiers sont les seuls responsables du contenu publié par leur soin. L'équipe n'a aucun contrôle
        sur le contenu de ces sites, ces contenus ne sauraient engager la responsabilité de l'administration.
      </Text>
      <Heading as="h3" size="sm" mb={3} mt={4}>
        L'Utilisateur
      </Heading>
      <Text>
        Toute information transmise par l'Utilisateur est de sa seule responsabilité. Il est rappelé que toute personne
        procédant à une fausse déclaration pour elle-même ou pour autrui s'expose, notamment, aux sanctions prévues à
        l'article 441-1 du code pénal, prévoyant des peines pouvant aller jusqu'à trois ans d'emprisonnement et 45 000
        euros d'amende.
      </Text>
      <Text mt={2}>
        L'Utilisateur s'engage à ne pas mettre en ligne de contenus ou informations contraires aux dispositions légales
        et réglementaires en vigueur.
      </Text>
      <Text mt={2}>
        Le contenu de l'Utilisateur peut être à tout moment et pour n'importe quelle raison supprimé ou modifié par le
        site, sans préavis.
      </Text>
      <Heading as="h2" size="md" mb={3} mt={6}>
        Mise à jour des conditions d'utilisation
      </Heading>
      <Text>
        Les termes des présentes conditions d'utilisation peuvent être amendés à tout moment, sans préavis, en fonction
        des modifications apportées à la plateforme, de l'évolution de la législation ou pour tout autre motif jugé
        nécessaire.
      </Text>
    </Page>
  )
}

export default CGU
