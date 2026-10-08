import { execFileSync } from "node:child_process";
import { readFileSync, statSync } from "node:fs";
import path from "node:path";

describe("ministry logo build asset", () => {
  it("generates the reviewed raster logo from the vector source", () => {
    const appRoot = process.cwd();
    execFileSync(process.execPath, [path.join(appRoot, "scripts/generate-ministry-logo.cjs")], { cwd: appRoot });

    const png = readFileSync(path.join(appRoot, "public/logo-ministere.generated.png"));
    expect(png.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    expect(statSync(path.join(appRoot, "public/logo-ministere.generated.png")).size).toBeGreaterThan(1000);
  });
});
