import type { PropsWithChildren } from "react";
import { Box } from "./Box";

import styles from "./RecapSection.module.css";

export const RecapSection = ({ children, ...rest }: PropsWithChildren<Record<never, never>>) => (
  <Box mt="5w" {...rest}>
    {children}
  </Box>
);

export const RecapSectionTitle = ({ children }: PropsWithChildren<Record<never, never>>) => (
  <h3 className="fr-h5 fr-mb-1w">{children}</h3>
);

export const RecapSectionItems = ({ children, ...rest }: PropsWithChildren<Record<never, never>>) => (
  <ul className={styles.list} {...rest}>
    {children}
  </ul>
);

export const RecapSectionItem = ({ children }: PropsWithChildren<Record<never, never>>) => <li>{children}</li>;

export const RecapSectionItemLegend = ({ children }: PropsWithChildren<Record<never, never>>) => (
  <>
    <strong>{children}</strong>&nbsp;:
  </>
);

export const RecapSectionItemContent = ({ children }: PropsWithChildren<Record<never, never>>) => (
  <>
    <br />
    {children}
  </>
);
