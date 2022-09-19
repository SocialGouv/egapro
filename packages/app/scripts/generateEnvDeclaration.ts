import dotenv from "dotenv";
import fs from "fs";
import path from "path";

const ROOT = path.resolve(__dirname, "..");
const envDistFileName = ".env.development";
const envDistPath = path.resolve(ROOT, envDistFileName);
console.log(`[generateEnvDeclaration] Reading ${envDistPath}`);
(async () => {
  const envConfig = dotenv.parse(await fs.promises.readFile(envDistPath, { encoding: "utf-8" }));

  const envKeys = Object.keys(envConfig);
  const declaration = `// Auto-generated with "generateEnvDeclaration" script
/* eslint-disable */
declare namespace NodeJS {
    interface ProcessEnv {${envKeys
      .map(
        env => `
        /**
         * ${envConfig[env] ? `Dist: \`${envConfig[env]}\`  ` : "No dist value.  "}
         * {@link [Local Env Dist](${envDistFileName})}
         */
        ${env}?: string;`,
      )
      .join("")
      .replace(/\n$/, "")}
    }
}
declare type ProcessEnvCustomKeys = ${envKeys
    .map(
      env => `
    | '${env}'`,
    )
    .join("")};`;

  const outputPath = path.resolve(ROOT, "env.d.ts");
  console.log(`[generateEnvDeclaration] Writing to ${outputPath}`);
  await fs.promises.writeFile(outputPath, declaration, { encoding: "utf-8" });
  console.log(`[generateEnvDeclaration] Done!`);
})();
