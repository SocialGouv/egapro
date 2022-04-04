import React, { useEffect, useCallback, useState } from "react"
import { Text, Heading, Link, Box, UnorderedList, ListItem, Table, Thead, Tbody, Tr, Th, Td } from "@chakra-ui/react"

import Page from "../components/Page"
import { useTitle } from "../utils/hooks"
import ButtonAction from "../components/ds/ButtonAction"

const CGU = () => {
  useTitle("Politique de confidentialité")
  const [hasTarteAuCitron, setTarteAuCitron] = useState(false)

  const openTarteAuCitron = useCallback(() => {
    // @ts-ignore
    if (window && window.tarteaucitron) {
      // @ts-ignore
      window.tarteaucitron.userInterface.openPanel()
    }
  }, [])

  useEffect(() => {
    // We need a delay to wait for tarteaucitron to be loaded.
    const timeout = setTimeout(() => {
      setTarteAuCitron(typeof document !== "undefined" && !!document.getElementById("tarteaucitronClosePanel"))
    }, 1000)

    return () => clearTimeout(timeout)
  }, [])

  return (
    <Page title="Protection des données à caractère personnel">
      <Heading as="h2" size="md" mb={3}>
        Responsable de traitement
      </Heading>
      <Text>Le responsable de traitements est la Direction Générale du Travail.</Text>
      <Heading as="h2" size="md" mb={3} mt={6}>
        Données personnelles traitées
      </Heading>
      <Text>La présente Plateforme traite les données personnelles suivantes :</Text>
      <UnorderedList mt={2} spacing={1}>
        <ListItem>
          Pour les simples visiteurs : identifiants de connexion, nature des opérations, date et heure de l'opération.
        </ListItem>
        <ListItem>Pour les utilisateurs du simulateur : adresse email, nom, prénom, numéro de téléphone.</ListItem>
        <ListItem>
          Pour les utilisateurs du formulaire de déclaration : adresse email, nom, prénom, numéro de téléphone.
        </ListItem>
      </UnorderedList>
      <Heading as="h2" size="md" mb={3} mt={6}>
        Finalités
      </Heading>
      <Text>
        Ces données sont nécessaires et proportionnées pour la réalisation de la mission de la Plateforme. Elles
        permettent de calculer les écarts de rémunération femmes-hommes au sein des entreprises, et de réaliser les
        déclarations qui en sont issues.
      </Text>
      <Heading as="h2" size="md" mb={3} mt={6}>
        Bases juridiques des traitements de données
      </Heading>
      <Text>
        Conformément aux dispositions de l'article 6-e du Règlement relatif à la protection des données (appelé RGPD),
        le traitement est nécessaire à l'exécution d'une mission d'intérêt public ou relève de l'exercice de l'autorité
        publique dont est investi le Responsable de traitement.
      </Text>
      <Text mt={2}>
        Conformément aux dispositions de l'article 6-c du Règlement relatif à la protection des données (appelé RGPD),
        le traitement de données relatif aux données de connexion est fondé sur l'obligation légale reposant sur le
        responsable de traitement au titre de la loi LCEN n° 2004-575 du 21 juin 2004 pour la confiance dans l'économie
        numérique et par l'article 1 du décret n°2021-1363 portant injonction, au regard de la menace grave et actuelle
        contre la sécurité nationale, de conservation pour une durée d'un an de certaines catégories de données de
        connexion.
      </Text>
      <Heading as="h2" size="md" mb={3} mt={6}>
        Durée de conservation
      </Heading>
      <UnorderedList mt={2} spacing={1}>
        <ListItem>
          Pour les données de connexion ou d'hébergeur : 12 mois (LCEN et articles 1 et 5 du décret n°2021-1362 du 20
          octobre 2021 relatif à la conservation des données).
        </ListItem>
        <ListItem>
          Pour les données des utilisateurs du simulateur et du formulaire de déclaration : temps nécessaire au
          traitement de la demande, sans excéder 3 mois.
        </ListItem>
      </UnorderedList>
      <Text mt={2}>
        Passés ces délais de conservation, les responsables de traitement s'engagent à supprimer définitivement les
        données des personnes concernées.
      </Text>
      <Heading as="h2" size="md" mb={3} mt={6}>
        Sécurité et confidentialité
      </Heading>
      <Text>
        Les données personnelles sont traitées dans des conditions sécurisées, selon les moyens actuels de la technique,
        dans le respect des dispositions relatives à la protection de la vie privée et notamment au référentiel général
        de sécurité, prévu à l'article 9 de l'ordonnance 2005-1516 du 8 décembre 2005 relative aux échanges
        électroniques entre les usagers et les autorités administratives et entre les autorités administratives.
      </Text>
      <Text mt={2}>Les moyens de sécurisation suivants ont notamment été mis en oeuvre&nbsp;:</Text>
      <UnorderedList mt={2} spacing={1}>
        <ListItem>Pare feu système ;</ListItem>
        <ListItem>Pare feu applicatif (WAF) ;</ListItem>
        <ListItem>Chiffrement des flux réseaux via certificat SSL ;</ListItem>
        <ListItem>Disque dur chiffré ;</ListItem>
        <ListItem>Services isolés dans des containers ;</ListItem>
        <ListItem>Gestion des journaux ;</ListItem>
        <ListItem>Monitoring Azure ;</ListItem>
        <ListItem>Administration et monitoring centralisés des accès ;</ListItem>
        <ListItem>Accès aux ressources via clés SSH (pas de mot de passe post installation) ;</ListItem>
        <ListItem>Sauvegarde des bases de données via solution de stockage Azure ;</ListItem>
        <ListItem>
          Accès aux données réservé aux membres de l'entité (hors restitution applicative publique des données) ;
        </ListItem>
        <ListItem>
          Accès aux données uniquement via un outil d'édition sécurisé (SSL + mot de passe) avec utilisation de comptes
          nominatifs.
        </ListItem>
      </UnorderedList>
      <Heading as="h2" size="md" mb={3} mt={6}>
        Droits des personnes concernées
      </Heading>
      <Text>
        Vous disposez des droits suivants concernant vos données à caractère personnel en tant qu'utilisateurs&nbsp;:
      </Text>
      <UnorderedList mt={2} spacing={1}>
        <ListItem>Droit d'information, d'accès et de communication des données ;</ListItem>
        <ListItem>Droit de rectification et le cas échéant de suppression des données ;</ListItem>
        <ListItem>Droit d'opposition au traitement de données, le cas échéant.</ListItem>
      </UnorderedList>
      <Text mt={2}>Vous disposez des droits suivants concernant vos données de connexion&nbsp;:</Text>
      <UnorderedList mt={2} spacing={1}>
        <ListItem>Droit d'information et droit d'accès ;</ListItem>
        <ListItem>Droit de rectification.</ListItem>
      </UnorderedList>
      <Text mt={2}>
        Vous pouvez exercer ces droits en écrivant à{" "}
        <Link color="primary.500" href="mailto:index@travail.gouv.fr">
          index@travail.gouv.fr
        </Link>
      </Text>
      <Text mt={2}>
        En raison de l'obligation de sécurité et de confidentialité dans le traitement des données à caractère personnel
        qui incombe à Index Egapro, votre demande sera uniquement traitée si vous rapportez la preuve de votre identité.
        Pour vous aider dans votre démarche, vous trouverez{" "}
        <Link isExternal color="primary.500" href="https://www.cnil.fr/fr/modele/courrier/exercer-son-droit-dacces">
          ici
        </Link>
        un modèle de courrier élaboré par la Cnil.
      </Text>
      <Text mt={2}>
        Vous avez la possibilité de vous opposer à un traitement de vos données personnelles. Pour vous aider dans votre
        démarche, vous trouverez{" "}
        <Link
          isExternal
          color="primary.500"
          href="https://www.cnil.fr/fr/modele/courrier/rectifier-des-donnees-inexactes-obsoletes-ou-perimees"
        >
          ici
        </Link>
        un modèle de courrier élaboré par la Cnil.
      </Text>
      <Heading as="h3" size="sm" mt={3}>
        <strong>Délais de réponse</strong>
      </Heading>
      <Text mt={2}>
        Le responsable de traitement s'engage à répondre à votre demande d'accès, de rectification ou d'opposition ou
        toute autre demande complémentaire d'informations dans un délai raisonnable qui ne saurait dépasser 1 mois à
        compter de la réception de votre demande.
      </Text>
      <Heading as="h2" size="md" mb={3} mt={6}>
        Destinataires
      </Heading>
      <Text>
        Les données collectées et les demandes, ou dossiers réalisés depuis la Plateforme sont traitées par les seules
        personnes juridiquement habilitées à connaître des informations traitées.
      </Text>
      <Text mt={2}>
        Le responsable de traitement veillent à ne fournir des accès qu'aux seules personnes juridiquement habilitées à
        connaître des informations traitées.
      </Text>
      <Heading as="h2" size="md" mb={3} mt={6}>
        Sous-traitants
      </Heading>
      <Text>
        Certaines des données sont envoyées à des sous-traitants pour réaliser certaines missions. Les responsables de
        traitement se sont assurés de la mise en œuvre par ses sous-traitants de garanties adéquates et du respect de
        conditions strictes de confidentialité, d'usage et de protection des données.
      </Text>
      <Table size="sm" mt="2" variant="striped">
        <Thead>
          <Tr>
            <Th>Partenaire</Th>
            <Th>Pays destinataire</Th>
            <Th>Traitement réalisé</Th>
            <Th>Garanties</Th>
          </Tr>
        </Thead>
        <Tbody>
          <Tr>
            <Td>Microsoft Azure</Td>
            <Td>France</Td>
            <Td>Hébergement</Td>
            <Td>
              <Link isExternal color="primary.500" href="https://privacy.microsoft.com/fr-fr/privacystatement">
                https://privacy.microsoft.com/fr-fr/privacystatement
              </Link>
            </Td>
          </Tr>
          <Tr>
            <Td>Google</Td>
            <Td>États-Unis</Td>
            <Td>Mesure d'audience</Td>
            <Td>
              <Link isExternal color="primary.500" href="https://policies.google.com/privacy?hl=fr ">
                https://policies.google.com/privacy?hl=fr
              </Link>
            </Td>
          </Tr>
        </Tbody>
      </Table>
      <Heading as="h2" size="md" mb={3} mt={6}>
        Cookies
      </Heading>
      <Text>
        Index Egapro pourra faire usage de cookies. Les traceurs ont vocation à être conservés sur le poste informatique
        de l'Internaute pour une durée allant jusqu'à 13 mois.
      </Text>
      <Text>Mesure d'audience&nbsp;:</Text>
      <Text>
        Certains cookies permettent d'établir des mesures statistiques de fréquentation et d'utilisation du site pouvant
        être utilisées à des fins de suivi et d'amélioration du service.
      </Text>
      <Table size="sm" mt="2" variant="striped">
        <Thead>
          <Tr>
            <Th>Nom</Th>
            <Th>Type</Th>
            <Th>Usage</Th>
            <Th>Émetteur</Th>
            <Th>Qui a accès ?</Th>
            <Th>Consentement</Th>
          </Tr>
        </Thead>
        <Tbody>
          <Tr>
            <Td>GoogleAnalytics</Td>
            <Td>Mesure d'audience</Td>
            <Td>Outil Google de mesure d'audience ;</Td>
            <Td>Google</Td>
            <Td>Direction Générale du Travail ; Google</Td>
            <Td>Oui</Td>
          </Tr>
          <Tr>
            <Td>GoogleTagManager</Td>
            <Td>Mesure d'audience</Td>
            <Td> Outil Google de gestion de balises ;</Td>
            <Td>Google</Td>
            <Td>Direction Générale du Travail ; Google</Td>
            <Td>Oui</Td>
          </Tr>
          <Tr>
            <Td>Ad.doubleclick.net</Td>
            <Td>Publicité</Td>
            <Td>Service de publicité et de diffusion d'annonce</Td>
            <Td>Google</Td>
            <Td>Direction Générale du Travail ; Google</Td>
            <Td>Oui</Td>
          </Tr>
        </Tbody>
      </Table>

      {hasTarteAuCitron ? (
        <Box mt={10} textAlign="center">
          <Text>
            Vous pouvez retirer votre consentement relatif aux cookies en cliquant sur "Modifier les réglages".{" "}
          </Text>
          <ButtonAction
            variant="outline"
            onClick={openTarteAuCitron}
            label="Modifier les réglages"
            leftIcon={<span aria-hidden="true">🙋</span>}
            size="lg"
            mt={4}
          />
        </Box>
      ) : (
        <Text>
          Seules certaines pages du site sont concernées par la mesure d’audience et l’analyse comportementale avec
          Google Analytics et vous n’avez visité aucune de ces pages. Aucun cookie Google Analytics n’a donc été déposé
          sur votre terminal.
        </Text>
      )}
    </Page>
  )
}

export default CGU
