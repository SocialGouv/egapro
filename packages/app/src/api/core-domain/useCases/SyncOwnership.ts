import { type IOwnershipRepo } from "@api/core-domain/repo/IOwnershipRepo";
import { AppError, type UseCase } from "@common/shared-domain";
import { Email } from "@common/shared-domain/domain/valueObjects";

interface Input {
  email: string;
  sirens: string[];
  username?: string;
}

export class SyncOwnership implements UseCase<Input, void> {
  constructor(private readonly ownershipRepo: IOwnershipRepo) {}

  public async execute({ sirens, email, username }: Input): Promise<void> {
    try {
      const emailVO = new Email(email);
      const currentSirens = await this.ownershipRepo.getAllSirenByEmail(emailVO, username || email);

      const sirensToRemove = currentSirens.filter(s => !sirens.includes(s));
      const sirensToAdd = sirens.filter(s => !currentSirens.includes(s));

      if (sirensToRemove.length > 0) await this.ownershipRepo.removeSirens(emailVO, sirensToRemove, username || email);
      if (sirensToAdd.length > 0) await this.ownershipRepo.addSirens(emailVO, sirensToAdd, username || email);
    } catch (error: unknown) {
      throw new SyncOwnershipUseCaseError("Error while sync ownerships", error as Error);
    }
  }
}

export class SyncOwnershipUseCaseError extends AppError {}
