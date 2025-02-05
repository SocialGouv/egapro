import "@testing-library/jest-dom";

import { expect, jest } from "@jest/globals";
import { screen } from "@testing-library/react";

global.jest = jest;
global.expect = expect;
global.screen = screen;

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
