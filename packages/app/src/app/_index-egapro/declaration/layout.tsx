import { fr } from "@codegouvfr/react-dsfr";
import Breadcrumb from "@codegouvfr/react-dsfr/Breadcrumb";
import { Display, headerFooterDisplayItem } from "@codegouvfr/react-dsfr/Display";
import { Footer } from "@codegouvfr/react-dsfr/Footer";
import { Header } from "@codegouvfr/react-dsfr/Header";
import { config } from "@common/config";
import { type PropsWithChildren } from "react";

const DEFAULT_TITLE = "Déclaration d'index Egapro";

type Props = {
  authenticated?: boolean;
  title?: string;
};

const homeLinkProps = {
  href: "/",
  title: "Accueil - Egapro - Ministère du Travail, de l’Emploi et de l’Insertion",
};

const BrandTop = () => (
  <>
    Ministère <br />
    du Travail,
    <br /> du plein Emploi
    <br /> et de l’Insertion
  </>
);

const DeclarationHeader = () => {
  // const { user, logout } = useUser();

  return (
    <Header
      brandTop={<BrandTop />}
      quickAccessItems={
        [
          // {
          //   iconId: "fr-icon-lock-fill",
          //   text: user ? "Se déconnecter" : "Se connecter",
          //   buttonProps: {
          //     onClick: user ? logout : () => redirect("/_index-egapro/declaration/email"),
          //   },
          // },
        ]
      }
      serviceTagline="Index de l’égalité professionnelle et représentation équilibrée femmes – hommes"
      serviceTitle="Egapro"
      homeLinkProps={homeLinkProps}
      navigation={[
        {
          linkProps: {
            href: "/",
            target: "_self",
          },
          text: "Accueil",
        },
        {
          isActive: true,
          linkProps: {
            href: "#",
            target: "/index-egapro",
          },
          text: "Index",
        },
        {
          linkProps: {
            href: "#",
            target: "_self",
          },
          text: "Représentation équilibrée",
        },
      ]}
    />
  );
};

const DeclarationFooter = () => {
  return (
    <>
      <Footer
        className={fr.cx("fr-mt-6w")}
        accessibility="partially compliant"
        brandTop={<BrandTop />}
        bottomItems={[
          // {
          //   linkProps: {
          //     href: "#",
          //   },
          //   text: "Mon super lien supplémentaire",
          // },
          {
            text: "Contribuez sur GitHub",
            linkProps: {
              // href: "https://github.com/SocialGouv/egapro/commit/<dev>",
              href: "https://github.com/SocialGouv/egapro",
            },
          },
          headerFooterDisplayItem,
        ]}
        contentDescription="
      Index Egapro et Représentation équilibrée sont développés et maintenus par les équipes de la fabrique
      numérique des ministères sociaux.
      "
        homeLinkProps={homeLinkProps}
        // cookiesManagementLinkProps={{
        //   href: "#",
        // }}
        personalDataLinkProps={{
          href: "../politique-de-confidentialite",
        }}
        termsLinkProps={{
          href: "../cgu",
        }}
        // websiteMapLinkProps={{
        //   href: "#",
        // }}
        accessibilityLinkProps={{
          href: "https://ara.numerique.gouv.fr/rapports/_YKXqg3aJMpFGmPh1tA0d/resultats",
        }}
      />
      <Display />
    </>
  );
};

const DeclarationLayout = ({ children }: Omit<PropsWithChildren<Props>, "authenticated">) => {
  return (
    <>
      <DeclarationHeader />

      <div className={fr.cx("fr-container")} style={{ maxWidth: 1000 }}>
        <Breadcrumb
          currentPageLabel={"Déclaration d'index"}
          homeLinkProps={{
            href: "/",
          }}
          segments={[
            {
              linkProps: {
                href: `${config.base_declaration_url}/commencer`,
              },
              label: "Index",
            },
          ]}
        />
        {children}
      </div>
      <DeclarationFooter />
    </>
  );
};

export default DeclarationLayout;

export const metadata = {
  title: { default: DEFAULT_TITLE, template: `%s - ${DEFAULT_TITLE}` },
  description:
    "Egapro permet aux entreprises de mesurer, en toute transparence, les écarts de rémunération entre les sexes et de mettre en évidence leurs points de progression.",
};
