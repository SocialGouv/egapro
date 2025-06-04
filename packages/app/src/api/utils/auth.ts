import "server-only";

import { authConfig } from "@api/core-domain/infra/auth/config";
import { UnexpectedSessionError } from "@common/shared-domain";
import { getServerSession, type Session } from "next-auth";

type AssertParam<T> = T | { check: T; message?: string };
type AssertSessionParams = {
  message?: string;
  owner?: AssertParam<string>;
  staff?: AssertParam<true>;
};

const defaultMessage = "No session found.";
const defaultOwnerMessage = "You are not owner of the provided Siren.";
const defaultStaffMessage = "You are not staff.";

/**
 * Assert that the current session is present and that the user is either owner of the provided Siren or staff.
 */
export const assertServerSession = async ({
  owner,
  staff,
  message = defaultMessage,
}: AssertSessionParams = {}): Promise<Session> => {
  const session = await getServerSession(authConfig);
  if (!session?.user) {
    throw new UnexpectedSessionError(message);
  }

  const shouldCheckOwner = typeof owner === "string" || owner?.check;
  const shouldCheckStaff = staff === true || staff?.check;
  const isOwner = session.user.companies.some(company => company.siren === shouldCheckOwner);
  const ownerErrorMessage = owner
    ? typeof owner === "string"
      ? defaultOwnerMessage
      : owner.message ?? defaultOwnerMessage
    : defaultOwnerMessage;
  const staffErrorMessage = staff
    ? typeof staff === "boolean"
      ? defaultStaffMessage
      : staff.message ?? defaultStaffMessage
    : defaultStaffMessage;

  if (shouldCheckOwner && shouldCheckStaff) {
    if (!(isOwner || session.user.staff)) {
      throw new UnexpectedSessionError(ownerErrorMessage);
    }
  } else if (shouldCheckOwner) {
    if (!isOwner) {
      throw new UnexpectedSessionError(ownerErrorMessage);
    }
  } else if (shouldCheckStaff) {
    if (!session.user.staff) {
      throw new UnexpectedSessionError(staffErrorMessage);
    }
  }

  return session;
};
