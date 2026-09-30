"use server";

import { globalMailerService } from "@api/core-domain/infra/mail";
import { entrepriseService } from "@api/core-domain/infra/services";
import { ownershipRequestRepo } from "@api/core-domain/repo";
import { CreateOwnershipRequest } from "@api/core-domain/useCases/CreateOwnershipRequest";
import { UpdateOwnershipRequestStatus } from "@api/core-domain/useCases/UpdateOwnershipRequestStatus";
import { assertServerSession } from "@api/utils/auth";
import { type CreateOwnershipRequestDTO } from "@common/core-domain/dtos/CreateOwnershipRequestDTO";
import { type OwnershipRequestActionDTO } from "@common/core-domain/dtos/OwnershipRequestActionDTO";

export async function putOwnershipRequest(formData: CreateOwnershipRequestDTO) {
  const session = await assertServerSession();

  const usecase = new CreateOwnershipRequest(ownershipRequestRepo, entrepriseService);

  // The asker is always the logged-in user, whatever the client sent.
  return await usecase.execute({ ...formData, askerEmail: session.user.email });
}

export async function acceptOwnershipRequest(ownershipRequestActionDTO: OwnershipRequestActionDTO) {
  await assertServerSession({
    staff: true,
  });

  const usecase = new UpdateOwnershipRequestStatus(ownershipRequestRepo, globalMailerService);
  return await usecase.execute(ownershipRequestActionDTO);
}
