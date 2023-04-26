import { PublicFooter } from "@components/Footers";
import { Container, Grid, GridCol, SideMenuLink } from "@design-system";
import Head from "next/head";
import { useRouter } from "next/router";
import { type PropsWithChildren } from "react";

import { type AppProps } from "./App";
import { App } from "./App";

export type AsideLinkProps = PropsWithChildren<{
  path: string;
}>;

export const AsideLink = ({ path, children }: AsideLinkProps) => {
  const router = useRouter();
  const currentRoute = router.pathname;
  return (
    <SideMenuLink
      href={`/representation-equilibree/${path}/`}
      isCurrent={currentRoute === `/representation-equilibree/${path}`}
    >
      {children}
    </SideMenuLink>
  );
};

const DEFAULT_TITLE = "Recherche - Représentation équilibrée Egapro";

export interface ConsultationRepeqLayoutProps extends AppProps {
  title?: string;
}
export const ConsultationRepeqLayout = ({
  children,
  title,
  ...rest
}: PropsWithChildren<ConsultationRepeqLayoutProps>) => {
  return (
    <App footer={<PublicFooter />} {...rest}>
      <Head>
        <title>{title ? title + " - " + DEFAULT_TITLE : DEFAULT_TITLE}</title>
      </Head>

      <Container py="6w">
        <Grid justifyCenter>
          <GridCol md={10} lg={8}>
            {children}
          </GridCol>
        </Grid>
      </Container>
    </App>
  );
};
