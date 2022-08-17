import { render } from "@testing-library/react"
import { Banner } from "@/components/ds/Banner"

beforeAll(() => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  })
})

test("should match snapshot", () => {
  const view = render(<Banner />)
  expect(view).toMatchSnapshot()
})
