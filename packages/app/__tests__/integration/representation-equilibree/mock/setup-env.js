/* eslint-disable no-undef */
// see https://kentcdodds.com/blog/stop-mocking-fetch
import { server } from "./server";

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
