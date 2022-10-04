import type { ReactNode } from "react";

export type AuthorizedChildType = {
  type: {
    name: string;
  };
};

export const compatibleComponents = (component: string, items: string[], array: ReactNode[]) => {
  array.forEach(child => {
    if (!(child as any).type || !(child as any).type?.name || !items.includes((child as any).type?.name)) {
      console.error(child);
      throw new Error(
        `Un enfant direct du composant ${component} n'est pas compatible. Seuls les composants ${items.join(
          ", ",
        )} sont acceptés.`,
      );
    }
  });
};
