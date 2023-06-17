import { authConfig } from "@api/core-domain/infra/auth/config";
import { representationEquilibreeRepo } from "@api/core-domain/repo";
import {
  DownloadRepresentationEquilibreeReceipt,
  DownloadRepresentationEquilibreeReceiptError,
} from "@api/core-domain/useCases/DownloadRepresentationEquilibreeReceipt";
import { jsxPdfService } from "@api/shared-domain/infra/pdf";
import { ValidationError } from "@common/shared-domain";
import { StatusCodes } from "http-status-codes";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

// TODO manual revalidate when edit
// export const revalidate = 60 * 60 * 24;
export const revalidate = false;
export const GET = async (req: Request, { params: { siren, year } }: { params: { siren: string; year: string } }) => {
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
