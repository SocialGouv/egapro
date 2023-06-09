import { Fragment, type PropsWithChildren } from "react";

import { Box } from "./Box";
// eslint-disable-next-line unused-imports/no-unused-imports -- used in doc
import { RecapCard } from "./RecapCard";
import styles from "./RecapSection.module.css";

/**
 * @deprecated Use {@link RecapCard} instead (in "react-dsfr" api-style)
 */
export const RecapSection = ({ children, ...rest }: PropsWithChildren) => (
  <Box mt="5w" {...rest}>
    {children}
  </Box>
);

/**
 * @deprecated Use {@link RecapCard} instead (in "react-dsfr" api-style)
 */
export const RecapSectionTitle = ({ children }: PropsWithChildren) => <h3 className="fr-h5 fr-mb-1w">{children}</h3>;

/**
 * @deprecated Use {@link RecapCard} instead (in "react-dsfr" api-style)
 */
export const RecapSectionItems = ({ children, ...rest }: PropsWithChildren) => (
  <ul className={styles.list} {...rest}>
    {children}
  </ul>
);

/**
 * @deprecated Use {@link RecapCard} instead (in "react-dsfr" api-style)
 */
export const RecapSectionItem = ({ children }: PropsWithChildren) => <li>{children}</li>;

/**
 * @deprecated Use {@link RecapCard} instead (in "react-dsfr" api-style)
 */
export const RecapSectionItemLegend = ({ children }: PropsWithChildren) => (
  <>
    <strong>{children}</strong>&nbsp;
  </>
);

/**
 * @deprecated Use {@link RecapCard} instead (in "react-dsfr" api-style)
 */
export const RecapSectionItemContent = ({ children }: PropsWithChildren) => (
  <>
    <br />
    {children}
  </>
);
