import type { PropsWithChildren } from "react";

export const FooterBottom = ({ children }: PropsWithChildren<Record<string, unknown>>) => {
  return (
    <div className="fr-footer__bottom">
      <ul className="fr-footer__bottom-list">{children}</ul>
      <div className="fr-footer__bottom-copy">
        <p>
          Sauf mention contraire, tous les contenus de ce site sont sous{" "}
          <a href="https://github.com/etalab/licence-ouverte/blob/master/LO.md" target="_blank" rel="noreferrer">
            licence etalab-2.0
          </a>
        </p>
      </div>
    </div>
  );
};
