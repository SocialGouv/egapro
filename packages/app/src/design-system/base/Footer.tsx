import Link from "next/link";
import { FooterBody } from "./FooterBody";
import { FooterBodyItem } from "./FooterBodyItem";
import { FooterBottom } from "./FooterBottom";
import { FooterBottomItem } from "./FooterBottomItem";
import { FooterBottomLink } from "./FooterBottomLink";
import { FooterContentLink } from "./FooterContentLink";
import { Logo } from "./Logo";

export const Footer = () => {
  return (
    <footer className="fr-footer" role="contentinfo" id="footer">
      <div className="fr-container">
        <FooterBody
          logo={
            <Link href="/">
              <a>
                <Logo />
              </a>
            </Link>
          }
          description="Représentation Équilibrée a été développé par les équipes de la fabrique numérique des ministères sociaux."
          items={
            <>
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
                  href=" https://travail-emploi.gouv.fr/droit-du-travail/egalite-professionnelle-discrimination-et-harcelement/representation-equilibree-f-h-dans-les-postes-de-direction-des-grandes/?id_mot=2004#liste-faq"
                  target="_blank"
                  rel="noreferrer"
                >
                  Consulter l'aide
                </FooterContentLink>
              </FooterBodyItem>
              <FooterBodyItem>
                <FooterContentLink
                  href="https://jedonnemonavis.numerique.gouv.fr/Demarches/2240?&view-mode=formulaire-avis&nd_mode=en-ligne-enti%C3%A8rement&nd_source=button&key=73366ddb13d498f4c77d01c2983bab48"
                  target="_blank"
                  rel="noreferrer"
                >
                  Donner votre avis
                </FooterContentLink>
              </FooterBodyItem>
              <FooterBodyItem>
                <FooterContentLink
                  href="https://github.com/SocialGouv/egapro/tree/v2.11.4"
                  target="_blank"
                  rel="noreferrer"
                >
                  Contribuer sur Github
                </FooterContentLink>
              </FooterBodyItem>
            </>
          }
        />
        <FooterBottom>
          <>
            <FooterBottomItem>
              <FooterBottomLink href="#">Plan du site</FooterBottomLink>
            </FooterBottomItem>
            <FooterBottomItem>
              <FooterBottomLink href="#">Mentions légales</FooterBottomLink>
            </FooterBottomItem>
          </>
        </FooterBottom>
      </div>
    </footer>
  );
};
