import type { ReactNode } from "react";

export type AuthorizedChildType = {
  type: {
    name: string;
  };
};

export const compatibleComponents = (items: string[], array: ReactNode[]) => {
  array.forEach(child => {
    if (!(child as any).type || !(child as any).type?.name || !items.includes((child as any).type?.name)) {
      console.error(child);
      throw new Error(
        `Ce composant n'est pas compatible avec le composant maître Modale. Seuls les composants ${items.join(
          ", ",
        )} sont acceptés.`,
      );
    }
  });
};
