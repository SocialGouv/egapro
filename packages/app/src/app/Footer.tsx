import { config } from "@common/config";

export const Footer = () => (
  <footer className="fr-footer" role="contentinfo" id="footer">
    <div className="fr-footer__top">
      <div className="fr-container">
        <div className="fr-grid-row fr-grid-row--start fr-grid-row--gutters">
          <div className="fr-col-12 fr-col-sm-3 fr-col-md-2">
            <p className="fr-footer__top-cat">Liens utiles</p>
            <ul className="fr-footer__top-list">
              <li>
                <a className="fr-footer__top-link" href="mailto:index@travail.gouv.fr" target="_blank" rel="noreferrer">
                  Contact support technique : index@travail.gouv.fr
                </a>
              </li>
              <li>
                <a
                  className="fr-footer__top-link"
                  href={`${config.apiv2_url}/public/referents_egalite_professionnelle.xlsx`}
                  target="_blank"
                  title="Télécharger la liste des référents au format xlsx"
                >
                  Télécharger la liste des référents Egapro - Dreets
                </a>
              </li>
            </ul>
          </div>
          <div className="fr-col-12 fr-col-sm-3 fr-col-md-2">
            <p className="fr-footer__top-cat">&nbsp;</p>
            <ul className="fr-footer__top-list">
              <li>
                <a className="fr-footer__top-link" href="/aide-index" target="_blank">
                  Consulter l'aide concernant l'index
                </a>
              </li>
              <li>
                <a className="fr-footer__top-link" href="/aide-proconnect" target="_blank">
                  Consulter l'aide ProConnect (ex MonComptePro)
                </a>
              </li>
            </ul>
          </div>
          <div className="fr-col-12 fr-col-sm-3 fr-col-md-2">
            <p className="fr-footer__top-cat">&nbsp;</p>
            <ul className="fr-footer__top-list">
              <li>
                <a
                  className="fr-footer__top-link"
                  href="https://travail-emploi.gouv.fr/droit-du-travail/egalite-professionnelle-discrimination-et-harcelement/indexegapro"
                  target="_blank"
                  rel="noreferrer"
                >
                  Consulter le site du Ministère du Travail - Index
                </a>
              </li>
              <li>
                <a
                  className="fr-footer__top-link"
                  href="https://travail-emploi.gouv.fr/droit-du-travail/egalite-professionnelle-discrimination-et-harcelement/representation-equilibree-f-h-dans-les-postes-de-direction-des-grandes/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Consulter le site du Ministère du Travail - Représentation équilibrée
                </a>
              </li>
            </ul>
          </div>
          <div className="fr-col-12 fr-col-sm-3 fr-col-md-2">
            <p className="fr-footer__top-cat">&nbsp;</p>
            <ul className="fr-footer__top-list">
              <li>
                <a
                  className="fr-footer__top-link"
                  href={`https://github.com/SocialGouv/egapro/commit/${config.githubSha}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Contribuer sur Github
                </a>
              </li>
              <li>
                <a className="fr-footer__top-link" href="/stats" target="_blank">
                  Statistiques
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
    <div className="fr-container">
      <div className="fr-footer__body">
        <div className="fr-footer__brand fr-enlarge-link">
          <a href="/" title="Accueil - Egapro - Ministère du Travail, de l'Emploi et de l'Insertion">
            <p className="fr-logo">
              Ministère <br />
              du Travail,
              <br /> et de l'emploi
            </p>
          </a>
        </div>
        <div className="fr-footer__content">
          <p className="fr-footer__content-desc">
            Index Egapro et Représentation équilibrée sont développés et maintenus par les équipes de la fabrique
            numérique des ministères sociaux.
          </p>
          <ul className="fr-footer__content-list">
            <li className="fr-footer__content-item">
              <a
                className="fr-footer__content-link"
                href="https://info.gouv.fr"
                target="_blank"
                rel="noopener noreferrer"
              >
                info.gouv.fr
              </a>
            </li>
            <li className="fr-footer__content-item">
              <a
                className="fr-footer__content-link"
                href="https://service-public.fr"
                target="_blank"
                rel="noopener noreferrer"
              >
                service-public.fr
              </a>
            </li>
            <li className="fr-footer__content-item">
              <a
                className="fr-footer__content-link"
                href="https://legifrance.gouv.fr"
                target="_blank"
                rel="noopener noreferrer"
              >
                legifrance.gouv.fr
              </a>
            </li>
            <li className="fr-footer__content-item">
              <a
                className="fr-footer__content-link"
                href="https://data.gouv.fr"
                target="_blank"
                rel="noopener noreferrer"
              >
                data.gouv.fr
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="fr-footer__bottom">
        <ul className="fr-footer__bottom-list">
          <li className="fr-footer__bottom-item">
            <a className="fr-footer__bottom-link" href="/declaration-accessibilite">
              Accessibilité : partiellement conforme
            </a>
          </li>
          <li className="fr-footer__bottom-item">
            <a className="fr-footer__bottom-link" href="/mentions-legales">
              Mentions légales
            </a>
          </li>
          <li className="fr-footer__bottom-item">
            <a className="fr-footer__bottom-link" href="/cgu">
              CGU
            </a>
          </li>
          <li className="fr-footer__bottom-item">
            <a className="fr-footer__bottom-link" href="/politique-de-confidentialite-v2">
              Politique de confidentialité
            </a>
          </li>
          <li className="fr-footer__bottom-item">
            <button
              className="fr-footer__bottom-link fr-icon-theme-fill fr-link--icon-left"
              aria-controls="fr-theme-modal"
              data-fr-opened="false"
            >
              Paramètres d'affichage
            </button>
          </li>
        </ul>
        <div className="fr-footer__bottom-copy">
          <p>
            Sauf mention contraire, tous les contenus de ce site sont sous{" "}
            <a href="https://github.com/SocialGouv/egapro/blob/master/LICENSE" target="_blank" rel="noreferrer">
              licence Apache 2.0
            </a>
          </p>
        </div>
      </div>
    </div>
  </footer>
);
