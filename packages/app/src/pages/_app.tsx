// should be before react-dsfr
if (typeof window !== "undefined") {
  const originalAppendChild = document.head.appendChild.bind(document.head);
  document.head.appendChild = node => {
    if (["style", "script"].includes(node.nodeName.toLocaleLowerCase())) {
      (node as unknown as Element).setAttribute(
        "nonce",
        (node as unknown as Element).getAttribute("nonce") || config.nonce,
      );
    }
    return originalAppendChild(node);
  };
}

import ConsentBanner from "@codegouvfr/react-dsfr/ConsentBanner";
import { createNextDsfrIntegrationApi } from "@codegouvfr/react-dsfr/next-pagesdir";
import { config } from "@common/config";
import { excludeType } from "@common/utils/types";
import { Matomo } from "@components/utils/Matomo";
import { fetcher } from "@services/apiClient";
import { type NextPage } from "next";
import { type AppProps } from "next/app";
import Link from "next/link";
import { SessionProvider } from "next-auth/react";
import { Children, cloneElement, type PropsWithChildren, type ReactNode, Suspense } from "react";
import { SWRConfig } from "swr";
import { SWRDevTools } from "swr-devtools";

// Only in TypeScript projects
declare module "@codegouvfr/react-dsfr/next-pagesdir" {
  interface RegisterLink {
    Link: typeof Link;
  }
}

declare module "@codegouvfr/react-dsfr/gdpr" {
  interface RegisterGdprServices {
    matomo: never;
  }
}

const { withDsfr, dsfrDocumentApi } = createNextDsfrIntegrationApi({
  defaultColorScheme: "system",
  Link,
});

export { dsfrDocumentApi };

///

export type NextPageWithLayout<P = object, IP = P> = NextPage<P, IP> & {
  getLayout?: (props: PropsWithChildren) => JSX.Element;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

const MyApp = ({ Component, pageProps }: AppPropsWithLayout) => {
  // Use the layout defined at the page level, if available
  const Layout = Component.getLayout ?? (({ children }) => <>{children}</>);

  return (
    <>
      <Suspense>
        <Matomo env={config.env} />
      </Suspense>
      <ConsentBanner
        gdprLinkProps={{
          href: "/politique-de-confidentialite#cookies",
        }}
        siteName="Egapro"
        services={[
          {
            name: "matomo",
            title: "Matomo",
            description: "Outil d’analyse comportementale des utilisateurs.",
          },
        ]}
      />
      <SWRDevTools>
        <SWRConfig
          value={{
            fetcher,
            revalidateOnFocus: false,
            onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
              // Never retry on 401 Unauthorized.
              if (error.statusCode === 401) return;

              // Never retry on 404.
              if (error.statusCode === 404) return;

              // Never retry on 403 Forbidden.
              if (error.statusCode === 403) return;

              // Never retry on 422 Unprocessable Entity.
              if (error.statusCode === 422) return;

              // Only retry up to 3 times.
              if (retryCount >= 3) return;

              // Retry after 5 seconds.
              setTimeout(() => revalidate({ retryCount }), 5000);
            },
          }}
        >
          <SessionProvider basePath="/apiv2/auth">
            <Layout>
              <Component {...pageProps} />
            </Layout>
          </SessionProvider>
        </SWRConfig>
      </SWRDevTools>
    </>
  );
};

const editChildren = (childrenToMap: ReactNode): ReactNode =>
  Children.map(childrenToMap, child => {
    if (
      !child ||
      typeof child === "string" ||
      typeof child === "boolean" ||
      typeof child === "number" ||
      !("type" in child) // exclude fragments
    ) {
      return child;
    }

    const isScript = excludeType<string>()(child.type).name === "Script";
    const isStyle = child.type === "style";
    const actualProps = child.props ?? {};

    if (isScript || isStyle) {
      const newChild = cloneElement(child, {
        nonce: config.nonce,
      });

      return newChild;
    }

    if (actualProps?.children?.length) {
      return cloneElement(child, {
        children: editChildren(actualProps.children),
      });
    }

    return child;
  });

const DsfrApp = withDsfr(MyApp);
export default typeof window !== "undefined"
  ? DsfrApp
  : function WrappedApp(props: AppProps) {
      const rendered = DsfrApp(props);
      return cloneElement(rendered, { children: editChildren(rendered.props.children) });
    };
