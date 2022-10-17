import type { PropsWithChildren } from "react";

export const FooterBottom = ({ children }: PropsWithChildren) => {
  return (
    <div className="fr-footer__bottom">
      <ul className="fr-footer__bottom-list">{children}</ul>
      <div className="fr-footer__bottom-copy">
        <p>
          Sauf mention contraire, tous les contenus de ce site sont sous{" "}
          <a href="https://www.apache.org/licenses/LICENSE-2.0" target="_blank" rel="noreferrer">
            licence Apache 2.0
          </a>
        </p>
      </div>
    </div>
  );
};
