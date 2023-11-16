import { authConfig } from "@api/core-domain/infra/auth/config";
import { representationEquilibreeRepo } from "@api/core-domain/repo";
import {
  DownloadRepresentationEquilibreeReceipt,
  DownloadRepresentationEquilibreeReceiptError,
} from "@api/core-domain/useCases/DownloadRepresentationEquilibreeReceipt";
import { jsxPdfService } from "@api/shared-domain/infra/pdf";
import { ValidationError } from "@common/shared-domain";
import { type NextRouteHandler } from "@common/utils/next";
import { StatusCodes } from "http-status-codes";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

// Note: [revalidatePath bug](https://github.com/vercel/next.js/issues/49387). Try to reactivate it when it will be fixed in Next (it seems to be fixed in Next 14).
// export const revalidate = 86400; // 24h
export const dynamic = "force-dynamic";

export const GET: NextRouteHandler<"siren" | "year"> = async (_, { params: { siren, year } }) => {
  const session = await getServerSession(authConfig);

  if (!session?.user) {
    return new NextResponse(null, {
      status: StatusCodes.UNAUTHORIZED,
    });
  }

  try {
    const useCase = new DownloadRepresentationEquilibreeReceipt(representationEquilibreeRepo, jsxPdfService);
    const buffer = await useCase.execute({ siren, year: +year });

    return new NextResponse(buffer, {
      status: StatusCodes.OK,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Size": `${buffer.byteLength}`,
      },
    });
  } catch (error: unknown) {
    if (error instanceof DownloadRepresentationEquilibreeReceiptError) {
      if (error.previousError instanceof ValidationError) {
        return NextResponse.json(
          { error: error.previousError.message },
          {
            status: StatusCodes.UNPROCESSABLE_ENTITY,
          },
        );
      }
      return NextResponse.json(
        { error: error.appErrorList().map(e => e.message) },
        {
          status: StatusCodes.BAD_REQUEST,
        },
      );
    } else {
      return new NextResponse(null, {
        status: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  }
};
