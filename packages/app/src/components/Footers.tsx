import { consentModalButtonProps } from "@codegouvfr/react-dsfr/ConsentBanner";
import { config } from "@common/config";
import {
  Footer,
  FooterBody,
  FooterBodyBrand,
  FooterBodyContent,
  FooterBodyContentDescription,
  FooterBodyContentItems,
  FooterBodyItem,
  FooterBottom,
  FooterBottomItem,
  FooterBottomLink,
  FooterContentLink,
  Logo,
} from "@design-system";

import { NextLinkOrA } from "../design-system/utils/NextLinkOrA";

/** Footer for entreprise */
export const EntrepriseFooter = () => {
  return (
    <Footer>
      <FooterBody>
        <FooterBodyBrand>
          <NextLinkOrA href="/">
            <Logo />
          </NextLinkOrA>
        </FooterBodyBrand>
        <FooterBodyContent>
          <FooterBodyContentDescription>
            Index Egapro et Représentation équilibrée sont développés et maintenus par les équipes de la fabrique
            numérique des ministères sociaux.
          </FooterBodyContentDescription>
          <FooterBodyContentItems>
            <FooterBodyItem>
              <FooterContentLink
                href=" https://travail-emploi.gouv.fr/IMG/xlsx/referents_egalite_professionnelle.xlsx"
                target="_blank"
                rel="noreferrer"
                title="Télécharger la liste des référents au format xlsx"
                isExternal
              >
                Télécharger la liste des référents
              </FooterContentLink>
            </FooterBodyItem>
            <FooterBodyItem>
              <FooterContentLink
                href={`https://github.com/SocialGouv/egapro/commit/${config.githubSha}`}
                target="_blank"
                rel="noreferrer"
                isExternal
              >
                Contribuer sur GitHub
              </FooterContentLink>
            </FooterBodyItem>
          </FooterBodyContentItems>
        </FooterBodyContent>
      </FooterBody>
      <FooterBottom>
        <FooterBottomItem>
          <FooterBottomLink href="/cgu">CGU</FooterBottomLink>
        </FooterBottomItem>
        <FooterBottomItem>
          <FooterBottomLink href="/mentions-legales">Mentions légales</FooterBottomLink>
        </FooterBottomItem>
        <FooterBottomItem>
          <FooterBottomLink href="/politique-de-confidentialite">Politique de confidentialité</FooterBottomLink>
        </FooterBottomItem>
        <FooterBottomItem>
          <FooterBottomLink
            href="https://ara.numerique.gouv.fr/rapports/_YKXqg3aJMpFGmPh1tA0d/resultats"
            target="_blank"
            isExternal
          >
            Accessibilité : partiellement conforme
          </FooterBottomLink>
        </FooterBottomItem>
        <FooterBottomItem>
          <button
            {...consentModalButtonProps.nativeButtonProps}
            onClick={consentModalButtonProps.onClick}
            className="fr-footer__bottom-link"
          >
            Gestion des cookies
          </button>
        </FooterBottomItem>
      </FooterBottom>
    </Footer>
  );
};

/** Footer for the general public */
export const PublicFooter = () => {
  return (
    <Footer>
      <FooterBody>
        <FooterBodyBrand>
          <NextLinkOrA href="/">
            <Logo />
          </NextLinkOrA>
        </FooterBodyBrand>
        <FooterBodyContent>
          <FooterBodyContentDescription>
            Index Egapro et Représentation équilibrée sont développés et maintenus par les équipes de la fabrique
            numérique des ministères sociaux.
          </FooterBodyContentDescription>
          <FooterBodyContentItems>
            <FooterBodyItem>
              Contact:&nbsp;
              <FooterContentLink href="mailto:index@travail.gouv.fr" target="_blank" rel="noreferrer" title="Contact">
                index@travail.gouv.fr
              </FooterContentLink>
            </FooterBodyItem>
            <FooterBodyItem>
              <FooterContentLink
                href={`https://github.com/SocialGouv/egapro/commit/${config.githubSha}`}
                target="_blank"
                rel="noreferrer"
              >
                Contribuer sur GitHub
              </FooterContentLink>
            </FooterBodyItem>
          </FooterBodyContentItems>
        </FooterBodyContent>
      </FooterBody>
      <FooterBottom>
        <FooterBottomItem>
          <FooterBottomLink href="/cgu">CGU</FooterBottomLink>
        </FooterBottomItem>
        <FooterBottomItem>
          <FooterBottomLink href="/mentions-legales">Mentions légales</FooterBottomLink>
        </FooterBottomItem>
        <FooterBottomItem>
          <FooterBottomLink href="/politique-de-confidentialite">Politique de confidentialité</FooterBottomLink>
        </FooterBottomItem>
        <FooterBottomItem>
          <button
            {...consentModalButtonProps.nativeButtonProps}
            onClick={consentModalButtonProps.onClick}
            className="fr-footer__bottom-link"
          >
            Gestion des cookies
          </button>
        </FooterBottomItem>
      </FooterBottom>
    </Footer>
  );
};
