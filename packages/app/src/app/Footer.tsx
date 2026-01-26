import { config } from "@common/config";
import { getExternalLinkTitle } from "@common/utils/accessibility";

// Accessibility status - centralized for easy updates
const accessibilityStatus = "partiellement conforme";

export const Footer = () => (
  <footer className="fr-footer" role="contentinfo" id="footer">
    <div className="fr-container">
      <div className="fr-footer__body">
        <div className="fr-footer__brand fr-enlarge-link">
          <a
            href="/"
            title="Accueil - Egapro - Ministère du Travail, de l'Emploi et de l'Insertion"
          >
            <p className="fr-logo">
              Ministère <br />
              du Travail
              <br /> et des solidarités
            </p>
          </a>
        </div>
        <div className="fr-footer__content">
          <p className="fr-footer__content-desc">
            Egapro permet aux entreprises de déclarer leurs indicateurs de
            rémunération et de représentation entre les femmes et les hommes.
          </p>
          <ul className="fr-footer__content-list">
            <li className="fr-footer__content-item">
              <a
                className="fr-footer__content-link"
                href="https://info.gouv.fr"
                target="_blank"
                rel="noopener noreferrer"
                title={getExternalLinkTitle("info.gouv.fr")}
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
                title={getExternalLinkTitle("service-public.fr")}
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
                title={getExternalLinkTitle("legifrance.gouv.fr")}
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
                title={getExternalLinkTitle("data.gouv.fr")}
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
            <a
              className="fr-footer__bottom-link"
              href="/declaration-accessibilite"
            >
              Accessibilité : {accessibilityStatus}
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
            <a
              className="fr-footer__bottom-link"
              href="/politique-de-confidentialite-v2"
            >
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
            <a
              href="https://github.com/SocialGouv/egapro/blob/master/LICENSE"
              target="_blank"
              rel="noopener noreferrer"
              title={getExternalLinkTitle("licence egapro")}
            >
              licence Apache 2.0
            </a>
          </p>
        </div>
      </div>
    </div>
  </footer>
);
