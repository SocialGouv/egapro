import { clsx } from "clsx";
import { type PropsWithChildren } from "react";

import styles from "./ContentWithChapter.module.css";

export const ContentWithChapter = ({ children, className }: PropsWithChildren<{ className?: string }>) => (
  <div className={clsx(styles.section, className)}>{children}</div>
);
