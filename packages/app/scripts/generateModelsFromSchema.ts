import { promises as fs } from "fs";
import type { JSONSchema4 } from "json-schema";
import { compile } from "json-schema-to-typescript";
import path from "path";

import schema from "../src/model.data/schema.json";

const baseRef = path.resolve(__dirname, "../src/model.data/");
(async () => {
  const content = await compile(schema as JSONSchema4, "Declaration", {
    cwd: baseRef,
    bannerComment: "/* eslint-disable */\n//Generated with generateModelsFromSchema.\n//DO NOT EDIT.",
  });

  await fs.writeFile(path.resolve(__dirname, "../src/common/models/generated.ts"), content);
})();
