import { render } from "@testing-library/react"
import Logo from "@/components/ds/Logo"

test("should match snapshot", () => {
  const view = render(<Logo />)
  expect(view).toMatchSnapshot()
})
