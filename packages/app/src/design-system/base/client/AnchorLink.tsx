"use client";

import { type PropsWithChildren } from "react";

export interface AnchorLinkProps {
  anchor: string;
  as?: "h1" | "h2" | "h3";
  iconSize?: "lg" | "sm" | "xl";
}
export const AnchorLink = ({ anchor, children, as: HtmlTag = "h3", iconSize }: PropsWithChildren<AnchorLinkProps>) => {
  return (
    <>
      <style jsx>{`
        ${HtmlTag} {
          cursor: pointer;
        }

        .fr-icon::before {
          ${!iconSize ? "--icon-size: 1rem;" : ""}
          vertical-align: middle;
          margin-left: 0.5rem;
        }

        ${HtmlTag} .fr-icon {
          display: none;
        }

        ${HtmlTag}:hover .fr-icon {
          display: inline;
        }
      `}</style>
      <HtmlTag
        id={anchor}
        onClick={() => {
          location.href = `#${anchor}`;
        }}
      >
        {children}
        <span className={`fr-icon-link fr-icon${iconSize ? `--${iconSize}` : ""}`}></span>
      </HtmlTag>
    </>
  );
};
