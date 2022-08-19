import { render } from "@testing-library/react"
import ActivityIndicator from "@/components/ds/ActivityIndicator"

test("should match snapshot", () => {
  const view = render(<ActivityIndicator />)
  expect(view).toMatchSnapshot()
})
