import { fr } from "@codegouvfr/react-dsfr";
import { Display, headerFooterDisplayItem } from "@codegouvfr/react-dsfr/Display";
import { Footer } from "@codegouvfr/react-dsfr/Footer";
import { Header } from "@codegouvfr/react-dsfr/Header";
import { AuthenticatedOnly } from "@components/AuthenticatedOnly";
import { useUser } from "@services/apiClient";
import Head from "next/head";
import type { PropsWithChildren } from "react";

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
  const { user } = useUser();

  return (
    <Header
      brandTop={<BrandTop />}
      quickAccessItems={[
        // {
        //   iconId: "fr-icon-account-circle-fill",
        //   linkProps: {
        //     href: "#",
        //     "aria-disabled": true,
        //   },
        //   text: user ? user.email : "",
        // },
        {
          iconId: "fr-icon-lock-fill",
          linkProps: {
            href: "#",
          },
          text: user ? "Se déconnecter" : "Se connecter",
        },
      ]}
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

const InnerDeclarationLayout = ({ children, title }: Omit<PropsWithChildren<Props>, "authenticated">) => {
  return (
    <>
      <Head>
        <meta
          name="description"
          content="Egapro permet aux entreprises de mesurer, en toute transparence, les écarts de rémunération entre les sexes et de mettre en évidence leurs points de progression."
        />
        <title>{[title, DEFAULT_TITLE].join(" - ")}</title>
      </Head>

      <DeclarationHeader />

      <div className={fr.cx("fr-container")} style={{ maxWidth: 1000 }}>
        {/* <Breadcrumb
          currentPageLabel="Validation de l'email"
          homeLinkProps={{
            href: "/",
          }}
          segments={[
            {
              linkProps: {
                href: "/too",
              },
              label: "toto",
            },
          ]}
        /> */}

        <div className={fr.cx("fr-grid-row")}>
          <div className={fr.cx("fr-col")}>
            <h1 className={fr.cx("fr-mt-8w", "fr-mb-4w")}>{title}</h1>
          </div>
        </div>
        {children}
      </div>
      <DeclarationFooter />
    </>
  );
};

export const DeclarationLayout = ({ children, title, authenticated = false }: PropsWithChildren<Props>) => {
  if (authenticated) {
    return (
      <AuthenticatedOnly redirectTo="/_index-egapro/declaration/email" disableAuth={!authenticated}>
        <InnerDeclarationLayout title={title}>{children}</InnerDeclarationLayout>
      </AuthenticatedOnly>
    );
  }

  return <InnerDeclarationLayout title={title}>{children}</InnerDeclarationLayout>;
};
