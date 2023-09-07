import { type DeclarationDTO } from "../../models/generated";

export { DeclarationDTO };

// période_suffisante is always present in new declarations, but not in existing ones.
export type EditDeclarationDTO = DeclarationDTO & { déclaration: { période_suffisante: boolean } };
export type CreateDeclarationDTO = Omit<EditDeclarationDTO, "id">;
