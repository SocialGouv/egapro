import type { ReactNode } from "react";
import type { Any } from "../../common/utils/types";

export type AuthorizedChildType = {
  type: {
    name: string;
  };
};

/** @deprecated */
// TODO: remove
export const compatibleComponents = (items: string[], array: ReactNode[]) => {
  array.forEach(child => {
    if (!(child as Any).type || !(child as Any).type?.name || !items.includes((child as Any).type?.name)) {
      console.error(child);
      throw new Error(
        `Ce composant n'est pas compatible avec le composant maître Modale. Seuls les composants ${items.join(
          ", ",
        )} sont acceptés.`,
      );
    }
  });
};
