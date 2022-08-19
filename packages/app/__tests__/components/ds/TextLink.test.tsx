import { render } from "@testing-library/react"
import TextLink from "@/components/ds/TextLink"

test("should match snapshot", () => {
  const view = render(<TextLink to="/home" />)
  expect(view).toMatchSnapshot()
})
