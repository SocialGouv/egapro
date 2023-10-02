export type AdminDeclarationDTO = {
  createdAt: string;
  declarantEmail: string;
  declarantFirstName: string;
  declarantLastName: string;
  name: string;
  siren: string;
  type: "index" | "repeq";
  year: number;
} & (
  | {
      index: number;
      type: "index";
      ues: Array<{
        name: string;
        siren: string;
      }>;
    }
  | {
      type: "repeq";
    }
);
