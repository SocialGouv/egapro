import { render } from "@testing-library/react"
import Footer from "@/components/ds/Footer"

test("should match snapshot", () => {
  const view = render(<Footer />)
  expect(view).toMatchSnapshot()
})
