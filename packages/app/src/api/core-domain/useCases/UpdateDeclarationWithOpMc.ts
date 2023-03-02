import type { UseCase } from "@common/shared-domain";

import type { IDeclarationRepo } from "../repo/IDeclarationRepo";

export class UpdateDeclarationWithOpMc implements UseCase<{}, {}> {
  constructor(private readonly declarationRepo: IDeclarationRepo) {}

  public execute(request?: {} | undefined): Promise<{}> {
    throw new Error("Method not implemented.");
  }
}
