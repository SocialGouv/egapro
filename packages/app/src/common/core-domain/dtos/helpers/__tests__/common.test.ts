import { SEARCH_MAX_QUERY_LENGTH, searchConsultationSchema } from "../common";

describe("searchConsultationSchema", () => {
  it("truncates an oversized public query and caps the page size", () => {
    const parsed = searchConsultationSchema.parse({ query: "a".repeat(5000), limit: "50" });
    expect(parsed.query).toHaveLength(SEARCH_MAX_QUERY_LENGTH);
    expect(parsed.limit).toBe(50);
    expect(() => searchConsultationSchema.parse({ limit: "100000" })).toThrow();
  });

  it("keeps a normal query untouched", () => {
    expect(searchConsultationSchema.parse({ query: "Total Recall" }).query).toBe("Total Recall");
  });
});
