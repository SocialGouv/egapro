import type { PropsWithChildren } from "react";

import { Box } from "./Box";
import styles from "./RecapSection.module.css";

export const RecapSection = ({ children, ...rest }: PropsWithChildren) => (
  <Box mt="5w" {...rest}>
    {children}
  </Box>
);

export const RecapSectionTitle = ({ children }: PropsWithChildren) => <h3 className="fr-h5 fr-mb-1w">{children}</h3>;

export const RecapSectionItems = ({ children, ...rest }: PropsWithChildren) => (
  <ul className={styles.list} {...rest}>
    {children}
  </ul>
);

export const RecapSectionItem = ({ children }: PropsWithChildren) => <li>{children}</li>;

export const RecapSectionItemLegend = ({ children }: PropsWithChildren) => (
  <>
    <strong>{children}</strong>&nbsp;
  </>
);

export const RecapSectionItemContent = ({ children }: PropsWithChildren) => (
  <>
    <br />
    {children}
  </>
);
