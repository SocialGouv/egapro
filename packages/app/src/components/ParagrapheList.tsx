import { cx, type CxArg } from "@codegouvfr/react-dsfr/tools/cx";
import { type ReactNode } from "react";

import style from "./ParagrapheList.module.css";

export interface ParagrapheListItem {
  className?: CxArg;
  content: ReactNode;
}
export interface ParagrapheListProps {
  className?: CxArg;
  items: ParagrapheListItem[];
}

export const ParagrapheList = ({ items, className }: ParagrapheListProps) => (
  <span className={cx(style["paragraphe-list"], className)}>
    {items.map((item, i) => (
      <span key={i} className={cx(style["paragraphe-item"], item.className)}>
        {item.content}
      </span>
    ))}
  </span>
);
