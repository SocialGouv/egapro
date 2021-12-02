import React from "react"
import Page from "../components/Page"
import { useTitle } from "../utils/hooks"

const title = "Accessibilité"

function Accessibilite() {
  useTitle(title)

  return (
    <Page title={title}>
      <h2>Déclaration d’accessibilité</h2>
      <p>
        Le Ministère du travail, de l’emploi et de l’insertion s’engage à rendre son service accessible conformément à
        l’article 47 de la loi n° 2005-102 du 11 février 2005.
      </p>
      <p>
        À cette fin, il met en œuvre la stratégie et l’action suivante : réalisation d’un audit de conformité à l'été de
        l’année 2021.
      </p>
      <p>Cette déclaration d’accessibilité s’applique au site Internet index-egapro.travail.gouv.fr.</p>
      <h2>État de conformité</h2>
      <p>
        Le site Internet index-egapro.travail.gouv.fr n’est pas encore en conformité avec le référentiel général
        d’amélioration de l’accessibilité (RGAA). Le site n’a pas encore été audité.
      </p>
      <p>Nous tâchons de rendre dès la conception, ce site accessible à toutes et à tous.</p>
      <h2>Résultat des tests</h2>
      <p>L’audit de conformité est en attente de réalisation (été de l’année 2021).</p>
      <h2>Établissement de cette déclaration d’accessibilité</h2>
      <p>Cette déclaration a été établie le 1er juin 2021.</p>
      <h2>Amélioration et contact</h2>
      <p>
        Si vous n’arrivez pas à accéder à un contenu ou à un service, vous pouvez contacter le responsable du site
        Internet index-egapro.travail.gouv.fr pour être orienté vers une alternative accessible ou obtenir le contenu
        sous une autre forme.
      </p>
      <p>
        E-mail : <a href="mailto:index@travail.gouv.fr">index@travail.gouv.fr</a>
      </p>
      <p>Nous essayons de répondre le plus rapidement possible.</p>
      <h2>Voies de recours</h2>
      <p>Cette procédure est à utiliser dans le cas suivant.</p>
      <p>
        Vous avez signalé au responsable du site internet un défaut d’accessibilité qui vous empêche d’accéder à un
        contenu ou à un des services du portail et vous n’avez pas obtenu de réponse satisfaisante.
      </p>
      <p>Vous pouvez :</p>
      <ul>
        <li>Écrire un message au Défenseur des droits</li>
        <li>Contacter le délégué du Défenseur des droits dans votre région</li>
        <li>
          Envoyer un courrier par la poste (gratuit, ne pas mettre de timbre) : <br />
          Défenseur des droits
          <br />
          Libre réponse
          <br />
          71120 75342 Paris CEDEX 07
        </li>
      </ul>
      <h2>En savoir plus sur l’accessibilité</h2>
      <p>
        Pour en savoir plus sur la politique d’accessibilité numérique de l’État :<br />
        <a href="http://references.modernisation.gouv.fr/accessibilite-numerique">
          http://references.modernisation.gouv.fr/accessibilite-numerique
        </a>
      </p>
    </Page>
  )
}

export default Accessibilite
