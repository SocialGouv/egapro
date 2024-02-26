import { authConfig } from "@api/core-domain/infra/auth/config";
import { entrepriseService } from "@api/core-domain/infra/services";
import { ownershipRequestRepo } from "@api/core-domain/repo";
import { GetOwnershipRequest } from "@api/core-domain/useCases/GetOwnershipRequest";
import { type NextServerPageProps } from "@common/utils/next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { OwnershipRequestPage } from "./OwnershipRequestList";
import { type SearchParams } from "./Pagination";

const AdminOwnershipRequestPage = async ({ searchParams }: NextServerPageProps<never, SearchParams>) => {
  const session = await getServerSession(authConfig);
  if (!session) redirect("/login");
  if (!session.user.staff) redirect("/");
  try {
    const useCase = new GetOwnershipRequest(ownershipRequestRepo, entrepriseService);
    const ownershipRequests = await useCase.execute(searchParams);

    return <OwnershipRequestPage fetchedItems={ownershipRequests} />;
  } catch (error: unknown) {
    console.error(error);
  }
  return null;
};

export default AdminOwnershipRequestPage;
