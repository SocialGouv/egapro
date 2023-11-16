import { referentRepo } from "@api/core-domain/repo";
import {
  EXPORT_EXT,
  EXPORT_MIME,
  ExportReferents,
  ExportReferentsError,
  type ValidExportExtension,
} from "@api/core-domain/useCases/referent/ExportReferents";
import { ValidationError } from "@common/shared-domain";
import { type NextRouteHandler } from "@common/utils/next";
import { type Any } from "@common/utils/types";
import { StatusCodes } from "http-status-codes";
import { NextResponse } from "next/server";

// Note: [revalidatePath bug](https://github.com/vercel/next.js/issues/49387). Try to reactivate it when it will be fixed in Next (it seems to be fixed in Next 14).
// export const revalidate = 86400; // 24h
export const dynamic = "force-dynamic";
// export const revalidate = 86_400; // 24h

export const GET: NextRouteHandler<"ext"> = async (_, { params: { ext } }) => {
  const useCase = new ExportReferents(referentRepo);

  try {
    assertExtension(ext);
    const readable = await useCase.execute(ext);
    return new NextResponse(readable as Any, {
      status: StatusCodes.OK,
      headers: {
        "Content-Size": `${readable.readableLength}`,
        "Content-Type": EXPORT_MIME[ext],
      },
    });
  } catch (error: unknown) {
    console.error(error);
    if (error instanceof ExportReferentsError) {
      if (error.previousError instanceof ValidationError) {
        return new NextResponse(error.previousError.message, {
          status: StatusCodes.UNPROCESSABLE_ENTITY,
        });
      }
      return new NextResponse(
        error
          .appErrorList()
          .map(e => e.message)
          .join("\n"),
        { status: StatusCodes.BAD_REQUEST },
      );
    } else {
      return new NextResponse(null, { status: StatusCodes.INTERNAL_SERVER_ERROR });
    }
  }
};

function assertExtension(ext: string): asserts ext is ValidExportExtension {
  if (!EXPORT_EXT.includes(ext as ValidExportExtension)) {
    throw new ValidationError(`Valid extensions are ${EXPORT_EXT}`);
  }
}
