import "@testing-library/jest-dom";

import { expect, jest } from "@jest/globals";
import { screen } from "@testing-library/react";

global.jest = jest;
global.expect = expect;
global.screen = screen;
global.TextEncoder = require("util").TextEncoder;
global.TextDecoder = require("util").TextDecoder;

process.env.EGAPRO_PROCONNECT_MANAGE_ORGANISATIONS_URL = "https://identite.proconnect.gouv.fr/manage-organizations";

import * as mockRouter from "next-router-mock";

const useRouter = mockRouter.useRouter;

jest.mock("next/navigation", () => ({
  ...mockRouter,
  useSearchParams: () => {
    const router = useRouter();
    const path = router.query;
    return new URLSearchParams(path);
  },
  usePathname: jest.fn(),
  redirect: jest.fn(),
}));

jest.mock("@formkit/auto-animate/react", () => ({
  useAutoAnimate: jest.fn(() => []),
}));
