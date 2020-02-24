import * as fs from "fs";
import * as path from "path";
import { Template } from "../index";

const template: Template = {
  html: fs.readFileSync(path.join(__dirname, "./success-email.html"), {
    encoding: "utf-8"
  }),
  text: fs.readFileSync(path.join(__dirname, "./success-email.txt"), {
    encoding: "utf-8"
  })
};

export default template;
