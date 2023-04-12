//
import { config } from "@common/config";
import type { DocumentProps } from "next/document";
import { Head, Html, Main, NextScript } from "next/document";

import { dsfrDocumentApi } from "./_app";

const { getColorSchemeHtmlAttributes, augmentDocumentForDsfr } = dsfrDocumentApi;

export default function Document(props: DocumentProps) {
  return (
    <Html lang="fr" {...getColorSchemeHtmlAttributes(props)} nonce={config.nonce}>
      <Head nonce={config.nonce}>
        <meta property="csp-nonce" content={config.nonce} />
      </Head>
      <body>
        <Main />
        <NextScript nonce={config.nonce} />
      </body>
    </Html>
  );
}

augmentDocumentForDsfr(Document);
