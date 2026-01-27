import prisma from "../../../../../lib/prisma";

export async function findRepresentationBySirenYear(
  siren: string,
  year: number,
) {
  return prisma.representation_equilibree.findUnique({
    where: { siren_year: { siren, year } } as any,
  });
}

export async function upsertRepresentation(
  siren: string,
  year: number,
  data: any,
) {
  return prisma.representation_equilibree.upsert({
    where: { siren_year: { siren, year } } as any,
    create: { siren, year, data },
    update: { data, modified_at: new Date() },
  });
}

export default { findRepresentationBySirenYear, upsertRepresentation };
