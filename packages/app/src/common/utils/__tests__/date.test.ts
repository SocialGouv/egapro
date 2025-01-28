import { dateObjectToDateTimeISOString } from "../date";

describe("dateObjectToDateTimeISOString", () => {
  it("should preserve time information when converting dates", () => {
    const testCases = [
      new Date("2024-02-14T09:30:45Z"),
      new Date("2024-02-14T14:20:15+01:00"),
      new Date("2024-02-14T23:55:00-05:00"),
    ];

    testCases.forEach(inputDate => {
      // Convert to ISO string
      const result = dateObjectToDateTimeISOString(inputDate);

      // The ISO string should include time information
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

      // Parse it back and verify it represents the same moment in time
      const parsedBack = new Date(result);

      // Round both timestamps to seconds to avoid millisecond differences
      const originalSeconds = Math.floor(inputDate.getTime() / 1000);
      const parsedSeconds = Math.floor(parsedBack.getTime() / 1000);

      expect(parsedSeconds).toBe(originalSeconds);
    });
  });
});
