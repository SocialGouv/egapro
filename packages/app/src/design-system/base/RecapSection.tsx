import type { PropsWithChildren } from "react";
import { Box } from "./Box";

import styles from "./RecapSection.module.css";

export const RecapSection = ({ children, ...rest }: PropsWithChildren<Record<never, never>>) => (
  <Box mt="5w" {...rest}>
    {children}
  </Box>
);

export const RecapSectionTitle = ({ children }: PropsWithChildren<Record<never, never>>) => (
  <Box as="h3" mb="2w" className="fr-h5">
    {children}
  </Box>
);

export const RecapSectionContent = ({ children, ...rest }: PropsWithChildren<Record<never, never>>) => (
  <Box as="ul" className={styles.list} {...rest}>
    {children}
  </Box>
);

export type RecapSectionContentItemProps = {
  data: string;
  legend: string;
};

export const RecapSectionContentItem = ({ legend, data }: RecapSectionContentItemProps) => (
  <li>
    <strong>{legend}</strong>&nbsp;:
    <br />
    {data}
  </li>
);
