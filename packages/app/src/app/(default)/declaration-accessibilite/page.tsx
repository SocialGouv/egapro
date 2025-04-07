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
            {/* <h1>{title}</h1>
            <p>
              La Fabrique numérique des ministères sociaux s'engage à rendre son service accessible, conformément à
              l'article 47 de la loi n° 2005-102 du 11 février 2005.
            </p>
            <p>
              Cette déclaration d'accessibilité s'applique à Egapro (
              <Link href="https://egapro.travail.gouv.fr/" target="_blank" rel="noreferrer">
                https://egapro.travail.gouv.fr/
              </Link>
              )
            </p>
            <h2>Etat de conformité</h2>
            <p>Egapro est partiellement conforme.</p>
            <p>
              Un audit{" "}
              <Link
                href="https://ara.numerique.gouv.fr/rapport/WaoTZUAr00Y9Cec2PQbnb/resultats"
                target="_blank"
                rel="noreferrer"
              >
                Ara
              </Link>{" "}
              a été réalisé sur 25 critères.
            </p>
            <h2>Contenus non accessibles</h2>
            <h2>Amélioration et contact</h2>
            <p>
              Si vous n'arrivez pas à accéder à un contenu ou à un service, vous pouvez contacter le responsable de
              Egapro pour être orienté vers une alternative accessible ou obtenir le contenu sous une autre forme.
            </p>
            <p>
              E-mail : <Link href="mailto:index@travail.gouv.fr">index@travail.gouv.fr</Link>
              <br />
              Nous essayons de répondre dans les 2 jours ouvrés.
            </p>
            <h2>Voie de recours</h2>
            <p>
              Cette procédure est à utiliser dans le cas suivant : vous avez signalé au responsable du site internet un
              défaut d'accessibilité qui vous empêche d'accéder à un contenu ou à un des services du portail et vous
              n'avez pas obtenu de réponse satisfaisante.
            </p>
            <p>Vous pouvez :</p>
            <p>
              Écrire un message au{" "}
              <Link href="https://formulaire.defenseurdesdroits.fr/" target="_blank" rel="noreferrer">
                Défenseur des droits
              </Link>
              <br />
              Contacter{" "}
              <Link href="https://www.defenseurdesdroits.fr/saisir/delegues" target="_blank" rel="noreferrer">
                le délégué du Défenseur des droits dans votre région
              </Link>
              <br />
              Envoyer un courrier par la poste (gratuit, ne pas mettre de timbre) :<br />
              Défenseur des droits
              <br />
              Libre réponse 71120 75342 Paris CEDEX 07
              <br />
              Cette déclaration d'accessibilité a été créé le 24 avril 2024 grâce au{" "}
              <Link
                href="https://betagouv.github.io/a11y-generateur-declaration/#create"
                target="_blank"
                rel="noreferrer"
              >
                Générateur de Déclaration d'Accessibilité de BetaGouv
              </Link>
              .
            </p> */}

            <h1>
              <span>D&Eacute;CLARATION D&rsquo;ACCESSIBILIT&Eacute;</span>
            </h1>
            <p>
              <span>
                La DNUM s&rsquo;engage &agrave; rendre son site web accessible conform&eacute;ment &agrave;
                l&rsquo;article 47 de la loi n&deg; 2005-102 du 11 f&eacute;vrier 2005.
              </span>
            </p>
            <p>
              <span>&Agrave; cette fin, elle met en &oelig;uvre la strat&eacute;gie et les actions suivantes</span>
              <span>: https://beta.gouv.fr/accessibilite/schema-pluriannuel</span>
            </p>
            <p>
              <span>Cette d&eacute;claration d&rsquo;accessibilit&eacute; s&rsquo;applique au site web :</span>
              <br />
              <span>https://egapro.travail.gouv.fr/</span>
            </p>
            <h2>
              <span>&Eacute;TAT DE CONFORMIT&Eacute;</span>
            </h2>
            <p>
              <span>
                Egapro est en conformit&eacute; partielle avec le r&eacute;f&eacute;rentiel g&eacute;n&eacute;ral
                d&rsquo;am&eacute;lioration de l&rsquo;accessibilit&eacute; en raison des non-conformit&eacute;s
                &eacute;num&eacute;r&eacute;es ci-dessous.
              </span>
            </p>
            <h2>
              <span>R&Eacute;SULTATS DES TESTS</span>
            </h2>
            <p>
              <span>
                L&rsquo;audit de conformit&eacute; au RGAA 4.1.2 r&eacute;alis&eacute; en interne r&eacute;v&egrave;le
                que :
              </span>
            </p>
            <ul>
              <li>
                <span>55,93% des crit&egrave;res RGAA sont respect&eacute;s.</span>
              </li>
            </ul>
            <h2>
              <span>Dans le d&eacute;tail :</span>
            </h2>
            <ul>
              <li>
                <span>Nombre de crit&egrave;res conformes :</span>
                <strong>
                  <span>33</span>
                </strong>
              </li>
              <li>
                <span>
                  Nombre de crit&egrave;res non conformes : <strong>26</strong>
                </span>
              </li>
              <li>
                <span>
                  Nombre de crit&egrave;res non applicables : <strong>47</strong>
                </span>
              </li>
            </ul>
            <h2>
              <span>CONTENUS NON ACCESSIBLES</span>
            </h2>
            <p>
              <span>Les contenus list&eacute;s ci-dessous ne sont pas accessibles pour les raisons suivantes :</span>
            </p>
            <h3>
              <span>Non conformit&eacute;</span>
            </h3>
            <p>Liste des crit&egrave;res non conformes :</p>
            <ul>
              <li>
                <span>1.1 Chaque image porteuse d&rsquo;information a-t-elle une alternative textuelle&thinsp;?</span>
              </li>
              <li>
                <span>
                  1.3 Pour chaque image porteuse d&apos;information ayant une alternative textuelle, cette alternative
                  est-elle pertinente (hors cas particuliers) ?
                </span>
              </li>
              <li>
                <span>
                  1.6 Chaque image porteuse d&rsquo;information a-t-elle, si n&eacute;cessaire, une description
                  d&eacute;taill&eacute;e&thinsp;?
                </span>
              </li>
              <li>
                <span>
                  3.1 Dans chaque page web, l&rsquo;information ne doit pas &ecirc;tre donn&eacute;e uniquement par la
                  couleur. Cette r&egrave;gle est-elle respect&eacute;e&thinsp;?
                </span>
              </li>
              <li>
                <span>
                  3.2 Dans chaque page web, le contraste entre la couleur du texte et la couleur de son
                  arri&egrave;re-plan est-il suffisamment &eacute;lev&eacute; (hors cas particuliers)&thinsp;?
                </span>
              </li>
              <li>
                <span>5.1 Chaque tableau de donn&eacute;es complexe a-t-il un r&eacute;sum&eacute;&thinsp;?</span>
              </li>
              <li>
                <span>
                  5.4 Pour chaque tableau de donn&eacute;es ayant un titre, le titre est-il correctement associ&eacute;
                  au tableau de donn&eacute;es&thinsp;?
                </span>
              </li>
              <li>
                <span>
                  5.7 Pour chaque tableau de donn&eacute;es, la technique appropri&eacute;e permettant d&rsquo;associer
                  chaque cellule avec ses en-t&ecirc;tes est-elle utilis&eacute;e (hors cas particuliers)&thinsp;?
                </span>
              </li>
              <li>
                <span>6.1 Chaque lien est-il explicite (hors cas particuliers)&thinsp;?</span>
              </li>
              <li>
                <span>
                  7.1 Chaque script est-il, si n&eacute;cessaire, compatible avec les technologies
                  d&rsquo;assistance&thinsp;?
                </span>
              </li>
              <li>
                <span>
                  7.3 Chaque script est-il contr&ocirc;lable par le clavier et par tout dispositif de pointage (hors cas
                  particuliers)&thinsp;?
                </span>
              </li>
              <li>
                <span>
                  7.5 Dans chaque page web, les messages de statut sont-ils correctement restitu&eacute;s par les
                  technologies d&rsquo;assistance&thinsp;?
                </span>
              </li>
              <li>
                <span>8.3 Dans chaque page web, la langue par d&eacute;faut est-elle pr&eacute;sente&thinsp;?</span>
              </li>
              <li>
                <span>8.6 Pour chaque page web ayant un titre de page, ce titre est-il pertinent&thinsp;?</span>
              </li>
              <li>
                <span>
                  8.9 Dans chaque page web, les balises ne doivent pas &ecirc;tre utilis&eacute;es uniquement &agrave;
                  des fins de pr&eacute;sentation. Cette r&egrave;gle est-elle respect&eacute;e&thinsp;?
                </span>
              </li>
              <li>
                <span>
                  9.1 Dans chaque page web, l&rsquo;information est-elle structur&eacute;e par l&rsquo;utilisation
                  appropri&eacute;e de titres&thinsp;?
                </span>
              </li>
              <li>
                <span>9.3 Dans chaque page web, chaque liste est-elle correctement structur&eacute;e&thinsp;?</span>
              </li>
              <li>
                <span>
                  10.2 Dans chaque page web, le contenu visible porteur d&rsquo;information reste-t-il pr&eacute;sent
                  lorsque les feuilles de styles sont d&eacute;sactiv&eacute;es&thinsp;?
                </span>
              </li>
              <li>
                <span>
                  10.7 Dans chaque page web, pour chaque &eacute;l&eacute;ment recevant le focus, la prise de focus
                  est-elle visible&thinsp;?
                </span>
              </li>
              <li>
                <span>
                  10.9 Dans chaque page web, l&rsquo;information ne doit pas &ecirc;tre donn&eacute;e uniquement par la
                  forme, taille ou position. Cette r&egrave;gle est-elle respect&eacute;e&thinsp;?
                </span>
              </li>
              <li>
                <span>
                  10.13 Dans chaque page web, les contenus additionnels apparaissant &agrave; la prise de focus ou au
                  survol d&rsquo;un composant d&rsquo;interface sont-ils contr&ocirc;lables par l&rsquo;utilisateur
                  (hors cas particuliers)&thinsp;?
                </span>
              </li>
              <li>
                <span>11.1 Chaque champ de formulaire a-t-il une &eacute;tiquette&thinsp;?</span>
              </li>
              <li>
                <span>
                  11.2 Chaque &eacute;tiquette associ&eacute;e &agrave; un champ de formulaire est-elle pertinente (hors
                  cas particuliers)&thinsp;?
                </span>
              </li>
              <li>
                <span>
                  11.10 Dans chaque formulaire, le contr&ocirc;le de saisie est-il utilis&eacute; de mani&egrave;re
                  pertinente (hors cas particuliers)&thinsp;?
                </span>
              </li>
              <li>
                <span>
                  12.1 Chaque ensemble de pages dispose-t-il de deux syst&egrave;mes de navigation diff&eacute;rents, au
                  moins (hors cas particuliers)&thinsp;?
                </span>
              </li>
              <li>
                <span>12.8 Dans chaque page web, l&rsquo;ordre de tabulation est-il coh&eacute;rent&thinsp;?</span>
              </li>
            </ul>
            <h2>
              <span>&Eacute;TABLISSEMENT DE CETTE D&Eacute;CLARATION D&rsquo;ACCESSIBILIT&Eacute;</span>
            </h2>
            <p>
              <span>Cette d&eacute;claration a &eacute;t&eacute; &eacute;tablie le 12 d&eacute;cembre 2024.</span>
            </p>
            <h3>
              <span>Technologies utilis&eacute;es pour la r&eacute;alisation du site web</span>
            </h3>
            <ul>
              <li>
                <span>HTML</span>
              </li>
              <li>
                <span>CSS</span>
              </li>
              <li>
                <span>JavaScript</span>
              </li>
            </ul>
            <h3>
              <span>Environnement de test</span>
            </h3>
            <p>
              Les tests des pages web ont &eacute;t&eacute; effectu&eacute;s avec les combinaisons de navigateurs web et
              lecteurs d&rsquo;&eacute;cran suivants :
            </p>
            <ul>
              <li>
                <span>Windows, NVDA 2024.4.1, Firefox 132</span>
              </li>
              <li>
                <span>Windows, Jaws 2025, Firefox 132</span>
              </li>
              <li>
                <span>macOS, VoiceOver, Safari</span>
              </li>
              <li>
                <span>Android natif, TalkBack 15.1, Chrome</span>
              </li>
              <li>
                <span>iOS, VoiceOver, Safari</span>
              </li>
            </ul>
            <h3>
              <span>Les outils suivants ont &eacute;t&eacute; utilis&eacute;s lors de l&rsquo;&eacute;valuation :</span>
            </h3>
            <ul>
              <li>
                <span>WCAG contrast checker</span>
              </li>
              <li>
                <span>HeadingsMap</span>
              </li>
              <li>
                <span>Web developer</span>
              </li>
              <li>
                <span>ARC Toolkit</span>
              </li>
            </ul>
            <h3>
              <span>Pages du site ayant fait l&rsquo;objet de la v&eacute;rification de conformit&eacute;</span>
            </h3>
            <ol>
              <li>
                <span>Accueil:</span>
                <a href="https://egapro.travail.gouv.fr/">https://egapro.travail.gouv.fr/</a>
              </li>
              <li>
                <span>Authentification:</span>
                <a href="https://egapro.travail.gouv.fr/login">https://egapro.travail.gouv.fr/login</a>
              </li>
              <li>
                <span>Aide:</span>
                <a href="https://egapro.travail.gouv.fr/aide-index">https://egapro.travail.gouv.fr/aide-index</a>
              </li>
              <li>
                <span>Accessibilit&eacute;:</span>
                <a href="https://egapro.travail.gouv.fr/declaration-accessibilite">
                  https://egapro.travail.gouv.fr/declaration-accessibilite
                </a>
              </li>
              <li>
                <span>Mentions l&eacute;gales:</span>
                <a href="https://egapro.travail.gouv.fr/mentions-legales">
                  https://egapro.travail.gouv.fr/mentions-legales
                </a>
              </li>
              <li>
                <span>Index de l&apos;&eacute;galit&eacute; professionnelle:</span>
                <a href="https://egapro.travail.gouv.fr/index-egapro">https://egapro.travail.gouv.fr/index-egapro</a>
              </li>
              <li>
                <span>Recherche sur l&apos;index:</span>
                <a href="https://egapro.travail.gouv.fr/index-egapro/recherche">
                  https://egapro.travail.gouv.fr/index-egapro/recherche
                </a>
              </li>
              <li>
                <span>Simulation de calcul (8 pages):</span>
                <a href="https://egapro.travail.gouv.fr/index-egapro/simulateur/commencer">
                  https://egapro.travail.gouv.fr/index-egapro/simulateur/commencer
                </a>
              </li>
              <li>
                <span>Repr&eacute;sentation &eacute;quilibr&eacute;e:</span>
                <a href="https://egapro.travail.gouv.fr/representation-equilibree">
                  https://egapro.travail.gouv.fr/representation-equilibree
                </a>
              </li>
              <li>
                <span>D&eacute;clarer les &eacute;carts:</span>
                <a href="https://egapro.travail.gouv.fr/representation-equilibree/assujetti">
                  https://egapro.travail.gouv.fr/representation-equilibree/assujetti
                </a>
              </li>
              <li>
                <span>Statistiques:</span>
                <a href="https://egapro.travail.gouv.fr/stats">https://egapro.travail.gouv.fr/stats</a>
              </li>
            </ol>
            <h2>
              <span>RETOUR D&rsquo;INFORMATION ET CONTACT</span>
            </h2>
            <p>
              <span>
                Si vous n&rsquo;arrivez pas &agrave; acc&eacute;der &agrave; un contenu ou &agrave; un service, vous
                pouvez contacter le responsable du site web pour &ecirc;tre orient&eacute; vers une alternative
                accessible ou obtenir le contenu sous une autre forme, en envoyant un message &agrave; l&rsquo;adresse
                suivante:
              </span>
              <a href="mailto:index@travail.gouv.fr">index@travail.gouv.fr</a>
              <span>.</span>
            </p>
            <h2>
              <span>VOIES DE RECOURS</span>
            </h2>
            <p>
              <span>Cette proc&eacute;dure est &agrave; utiliser dans le cas suivant.</span>
            </p>
            <p>
              <span>
                Vous avez signal&eacute; au responsable du site web un d&eacute;faut d&rsquo;accessibilit&eacute; qui
                vous emp&ecirc;che d&rsquo;acc&eacute;der &agrave; un contenu ou &agrave; un des services et vous
                n&rsquo;avez pas obtenu de r&eacute;ponse satisfaisante.
              </span>
            </p>
            <ul>
              <li>
                <span>&Eacute;crire un message au D&eacute;fenseur des droits (</span>
                <a href="https://formulaire.defenseurdesdroits.fr/">https://formulaire.defenseurdesdroits.fr/</a>
                <span>)</span>
              </li>
              <li>
                <span>
                  Contacter le d&eacute;l&eacute;gu&eacute; du D&eacute;fenseur des droits dans votre r&eacute;gion (
                </span>
                <a href="https://www.defenseurdesdroits.fr/saisir/delegues">
                  https://www.defenseurdesdroits.fr/saisir/delegues
                </a>
                <span>)</span>
              </li>
              <li>
                <span>Envoyer un courrier par la poste (gratuit, ne pas mettre de timbre)</span>
                <br />
                <span>D&eacute;fenseur des droits</span>
                <br />
                <span>Libre r&eacute;ponse 71120</span>
                <br />
                <span>75342 Paris CEDEX 07</span>
              </li>
            </ul>
          </GridCol>
        </Grid>
      </Container>
    </section>
  );
};

export default AccessibilityStatement;
