import { Container, Grid, GridCol } from "@design-system";

const title = "Déclaration d'accessibilité";
export const metadata = {
  title,
  openGraph: {
    title,
  },
};

const AccessibilityStatement = () => {
  return (
    <section>
      <Container py="8w">
        <Grid align="center">
          <GridCol md={10} lg={8}>
            <h1>{title}</h1>
            <p>
              La DNUM s&rsquo;engage &agrave; rendre son site web accessible conform&eacute;ment &agrave;
              l&rsquo;article 47 de la loi n&deg; 2005-102 du 11 f&eacute;vrier 2005.
            </p>
            <p>
              &Agrave; cette fin, elle met en &oelig;uvre la strat&eacute;gie et les actions suivantes:
              <br />
              <a href="https://beta.gouv.fr/accessibilite/schema-pluriannuel">
                https://beta.gouv.fr/accessibilite/schema-pluriannuel
              </a>
            </p>
            <p>
              Cette d&eacute;claration d&rsquo;accessibilit&eacute; s&rsquo;applique au site web:
              <br />
              <a href="https://egapro.travail.gouv.fr/">https://egapro.travail.gouv.fr/</a>
            </p>
            <h2>&Eacute;TAT DE CONFORMIT&Eacute;</h2>
            <p>
              Egapro est en conformit&eacute; partielle avec le r&eacute;f&eacute;rentiel g&eacute;n&eacute;ral
              d&rsquo;am&eacute;lioration de l&rsquo;accessibilit&eacute; en raison des non-conformit&eacute;s
              &eacute;num&eacute;r&eacute;es ci-dessous.
            </p>
            <h2>R&Eacute;SULTATS DES TESTS</h2>
            <p>
              L&rsquo;audit de conformit&eacute; au RGAA 4.1.2 r&eacute;alis&eacute; en interne r&eacute;v&egrave;le
              que:
              <ul>
                <li>55,93% des crit&egrave;res RGAA sont respect&eacute;s.</li>
              </ul>
            </p>
            <p>
              Dans le d&eacute;tail:
              <ul>
                <li>
                  Nombre de crit&egrave;res conformes:<strong>33</strong>
                </li>
                <li>
                  Nombre de crit&egrave;res non conformes: <strong>26</strong>
                </li>
                <li>
                  Nombre de crit&egrave;res non applicables: <strong>47</strong>
                </li>
              </ul>
            </p>
            <h2>CONTENUS NON ACCESSIBLES</h2>
            <p>Les contenus list&eacute;s ci-dessous ne sont pas accessibles pour les raisons suivantes:</p>
            <h3>Non conformit&eacute;</h3>
            <p>
              Liste des crit&egrave;res non conformes:
              <ul>
                <li>1.1 Chaque image porteuse d&rsquo;information a-t-elle une alternative textuelle&thinsp;?</li>
                <li>
                  1.3 Pour chaque image porteuse d&apos;information ayant une alternative textuelle, cette alternative
                  est-elle pertinente (hors cas particuliers) ?
                </li>
                <li>
                  1.6 Chaque image porteuse d&rsquo;information a-t-elle, si n&eacute;cessaire, une description
                  d&eacute;taill&eacute;e&thinsp;?
                </li>
                <li>
                  3.1 Dans chaque page web, l&rsquo;information ne doit pas &ecirc;tre donn&eacute;e uniquement par la
                  couleur. Cette r&egrave;gle est-elle respect&eacute;e&thinsp;?
                </li>
                <li>
                  3.2 Dans chaque page web, le contraste entre la couleur du texte et la couleur de son
                  arri&egrave;re-plan est-il suffisamment &eacute;lev&eacute; (hors cas particuliers)&thinsp;?
                </li>
                <li>5.1 Chaque tableau de donn&eacute;es complexe a-t-il un r&eacute;sum&eacute;&thinsp;?</li>
                <li>
                  5.4 Pour chaque tableau de donn&eacute;es ayant un titre, le titre est-il correctement associ&eacute;
                  au tableau de donn&eacute;es&thinsp;?
                </li>
                <li>
                  5.7 Pour chaque tableau de donn&eacute;es, la technique appropri&eacute;e permettant d&rsquo;associer
                  chaque cellule avec ses en-t&ecirc;tes est-elle utilis&eacute;e (hors cas particuliers)&thinsp;?
                </li>
                <li>6.1 Chaque lien est-il explicite (hors cas particuliers)&thinsp;?</li>
                <li>
                  7.1 Chaque script est-il, si n&eacute;cessaire, compatible avec les technologies
                  d&rsquo;assistance&thinsp;?
                </li>
                <li>
                  7.3 Chaque script est-il contr&ocirc;lable par le clavier et par tout dispositif de pointage (hors cas
                  particuliers)&thinsp;?
                </li>
                <li>
                  7.5 Dans chaque page web, les messages de statut sont-ils correctement restitu&eacute;s par les
                  technologies d&rsquo;assistance&thinsp;?
                </li>
                <li>8.3 Dans chaque page web, la langue par d&eacute;faut est-elle pr&eacute;sente&thinsp;?</li>
                <li>8.6 Pour chaque page web ayant un titre de page, ce titre est-il pertinent&thinsp;?</li>
                <li>
                  8.9 Dans chaque page web, les balises ne doivent pas &ecirc;tre utilis&eacute;es uniquement &agrave;
                  des fins de pr&eacute;sentation. Cette r&egrave;gle est-elle respect&eacute;e&thinsp;?
                </li>
                <li>
                  9.1 Dans chaque page web, l&rsquo;information est-elle structur&eacute;e par l&rsquo;utilisation
                  appropri&eacute;e de titres&thinsp;?
                </li>
                <li>9.3 Dans chaque page web, chaque liste est-elle correctement structur&eacute;e&thinsp;?</li>
                <li>
                  10.2 Dans chaque page web, le contenu visible porteur d&rsquo;information reste-t-il pr&eacute;sent
                  lorsque les feuilles de styles sont d&eacute;sactiv&eacute;es&thinsp;?
                </li>
                <li>
                  10.7 Dans chaque page web, pour chaque &eacute;l&eacute;ment recevant le focus, la prise de focus
                  est-elle visible&thinsp;?
                </li>
                <li>
                  10.9 Dans chaque page web, l&rsquo;information ne doit pas &ecirc;tre donn&eacute;e uniquement par la
                  forme, taille ou position. Cette r&egrave;gle est-elle respect&eacute;e&thinsp;?
                </li>
                <li>
                  10.13 Dans chaque page web, les contenus additionnels apparaissant &agrave; la prise de focus ou au
                  survol d&rsquo;un composant d&rsquo;interface sont-ils contr&ocirc;lables par l&rsquo;utilisateur
                  (hors cas particuliers)&thinsp;?
                </li>
                <li>11.1 Chaque champ de formulaire a-t-il une &eacute;tiquette&thinsp;?</li>
                <li>
                  11.2 Chaque &eacute;tiquette associ&eacute;e &agrave; un champ de formulaire est-elle pertinente (hors
                  cas particuliers)&thinsp;?
                </li>
                <li>
                  11.10 Dans chaque formulaire, le contr&ocirc;le de saisie est-il utilis&eacute; de mani&egrave;re
                  pertinente (hors cas particuliers)&thinsp;?
                </li>
                <li>
                  12.1 Chaque ensemble de pages dispose-t-il de deux syst&egrave;mes de navigation diff&eacute;rents, au
                  moins (hors cas particuliers)&thinsp;?
                </li>
                <li>12.8 Dans chaque page web, l&rsquo;ordre de tabulation est-il coh&eacute;rent&thinsp;?</li>
              </ul>
            </p>
            <h2>&Eacute;TABLISSEMENT DE CETTE D&Eacute;CLARATION D&rsquo;ACCESSIBILIT&Eacute;</h2>
            <p>Cette d&eacute;claration a &eacute;t&eacute; &eacute;tablie le 12 d&eacute;cembre 2024.</p>
            <h3>Technologies utilis&eacute;es pour la r&eacute;alisation du site web</h3>
            <p>
              <ul>
                <li>HTML</li>
                <li>CSS</li>
                <li>JavaScript</li>
              </ul>
            </p>
            <h3>Environnement de test</h3>
            <p>
              Les tests des pages web ont &eacute;t&eacute; effectu&eacute;s avec les combinaisons de navigateurs web et
              lecteurs d&rsquo;&eacute;cran suivants:
              <ul>
                <li>Windows, NVDA 2024.4.1, Firefox 132</li>
                <li>Windows, Jaws 2025, Firefox 132</li>
                <li>macOS, VoiceOver, Safari</li>
                <li>Android natif, TalkBack 15.1, Chrome</li>
                <li>iOS, VoiceOver, Safari</li>
              </ul>
            </p>
            <h3>Les outils suivants ont &eacute;t&eacute; utilis&eacute;s lors de l&rsquo;&eacute;valuation:</h3>
            <p>
              <ul>
                <li>WCAG contrast checker</li>
                <li>HeadingsMap</li>
                <li>Web developer</li>
                <li>ARC Toolkit</li>
              </ul>
            </p>
            <h3>Pages du site ayant fait l&rsquo;objet de la v&eacute;rification de conformit&eacute;</h3>
            <p>
              <ol>
                <li>
                  Accueil:
                  <a href="https://egapro.travail.gouv.fr/">https://egapro.travail.gouv.fr/</a>
                </li>
                <li>
                  Authentification:
                  <a href="https://egapro.travail.gouv.fr/login">https://egapro.travail.gouv.fr/login</a>
                </li>
                <li>
                  Aide:
                  <a href="https://egapro.travail.gouv.fr/aide-index">https://egapro.travail.gouv.fr/aide-index</a>
                </li>
                <li>
                  Accessibilit&eacute;:
                  <a href="https://egapro.travail.gouv.fr/declaration-accessibilite">
                    https://egapro.travail.gouv.fr/declaration-accessibilite
                  </a>
                </li>
                <li>
                  Mentions l&eacute;gales:
                  <a href="https://egapro.travail.gouv.fr/mentions-legales">
                    https://egapro.travail.gouv.fr/mentions-legales
                  </a>
                </li>
                <li>
                  Index de l&apos;&eacute;galit&eacute; professionnelle:
                  <a href="https://egapro.travail.gouv.fr/index-egapro">https://egapro.travail.gouv.fr/index-egapro</a>
                </li>
                <li>
                  Recherche sur l&apos;index:
                  <a href="https://egapro.travail.gouv.fr/index-egapro/recherche">
                    https://egapro.travail.gouv.fr/index-egapro/recherche
                  </a>
                </li>
                <li>
                  Simulation de calcul (8 pages):
                  <a href="https://egapro.travail.gouv.fr/index-egapro/simulateur/commencer">
                    https://egapro.travail.gouv.fr/index-egapro/simulateur/commencer
                  </a>
                </li>
                <li>
                  Repr&eacute;sentation &eacute;quilibr&eacute;e:
                  <a href="https://egapro.travail.gouv.fr/representation-equilibree">
                    https://egapro.travail.gouv.fr/representation-equilibree
                  </a>
                </li>
                <li>
                  D&eacute;clarer les &eacute;carts:
                  <a href="https://egapro.travail.gouv.fr/representation-equilibree/assujetti">
                    https://egapro.travail.gouv.fr/representation-equilibree/assujetti
                  </a>
                </li>
                <li>
                  Statistiques:
                  <a href="https://egapro.travail.gouv.fr/stats">https://egapro.travail.gouv.fr/stats</a>
                </li>
              </ol>
            </p>
            <h2>RETOUR D&rsquo;INFORMATION ET CONTACT</h2>
            <p>
              Si vous n&rsquo;arrivez pas &agrave; acc&eacute;der &agrave; un contenu ou &agrave; un service, vous
              pouvez contacter le responsable du site web pour &ecirc;tre orient&eacute; vers une alternative accessible
              ou obtenir le contenu sous une autre forme, en envoyant un message &agrave; l&rsquo;adresse suivante:
              <a href="mailto:index@travail.gouv.fr">index@travail.gouv.fr</a>.
            </p>
            <h2>VOIES DE RECOURS</h2>
            <p>Cette proc&eacute;dure est &agrave; utiliser dans le cas suivant.</p>
            <p>
              Vous avez signal&eacute; au responsable du site web un d&eacute;faut d&rsquo;accessibilit&eacute; qui vous
              emp&ecirc;che d&rsquo;acc&eacute;der &agrave; un contenu ou &agrave; un des services et vous n&rsquo;avez
              pas obtenu de r&eacute;ponse satisfaisante.
              <ul>
                <li>
                  &Eacute;crire un message au D&eacute;fenseur des droits (
                  <a href="https://formulaire.defenseurdesdroits.fr/">https://formulaire.defenseurdesdroits.fr/</a>)
                </li>
                <li>
                  Contacter le d&eacute;l&eacute;gu&eacute; du D&eacute;fenseur des droits dans votre r&eacute;gion (
                  <a href="https://www.defenseurdesdroits.fr/saisir/delegues">
                    https://www.defenseurdesdroits.fr/saisir/delegues
                  </a>
                  )
                </li>
                <li>
                  Envoyer un courrier par la poste (gratuit, ne pas mettre de timbre)
                  <br />
                  D&eacute;fenseur des droits
                  <br />
                  Libre r&eacute;ponse 71120
                  <br />
                  75342 Paris CEDEX 07
                </li>
              </ul>
            </p>
          </GridCol>
        </Grid>
      </Container>
    </section>
  );
};

export default AccessibilityStatement;
