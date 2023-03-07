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
import NextLink from "next/link";

/** Footer for entreprise */
export const EntrepriseFooter = () => {
  return (
    <Footer>
      <FooterBody>
        <FooterBodyBrand>
          <NextLink href="/">
            <Logo />
          </NextLink>
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
              >
                Télécharger la liste des référents
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
          <NextLink href="/cgu" passHref legacyBehavior>
            <FooterBottomLink>CGU</FooterBottomLink>
          </NextLink>
        </FooterBottomItem>
        <FooterBottomItem>
          <NextLink href="/mentions-legales" passHref legacyBehavior>
            <FooterBottomLink>Mentions légales</FooterBottomLink>
          </NextLink>
        </FooterBottomItem>
        <FooterBottomItem>
          <NextLink href="/politique-de-confidentialite" passHref legacyBehavior>
            <FooterBottomLink>Politique de confidentialité</FooterBottomLink>
          </NextLink>
        </FooterBottomItem>
        <FooterBottomItem>
          <FooterBottomLink
            href="https://ara.numerique.gouv.fr/rapports/_YKXqg3aJMpFGmPh1tA0d/resultats"
            target="_blank"
          >
            Accessibilité : partiellement conforme
          </FooterBottomLink>
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
          <NextLink href="/">
            <Logo />
          </NextLink>
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
          <NextLink href="/cgu" passHref legacyBehavior>
            <FooterBottomLink>CGU</FooterBottomLink>
          </NextLink>
        </FooterBottomItem>
        <FooterBottomItem>
          <NextLink href="/mentions-legales" passHref legacyBehavior>
            <FooterBottomLink>Mentions légales</FooterBottomLink>
          </NextLink>
        </FooterBottomItem>
        <FooterBottomItem>
          <NextLink href="/politique-de-confidentialite" passHref legacyBehavior>
            <FooterBottomLink>Politique de confidentialité</FooterBottomLink>
          </NextLink>
        </FooterBottomItem>
      </FooterBottom>
    </Footer>
  );
};
