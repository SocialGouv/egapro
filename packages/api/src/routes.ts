import * as Router from "koa-router";
import {
  createIndicatorsData,
  getIndicatorsData,
  sendEmail,
  updateIndicatorsData
} from "./controller";

const routeOptions: Router.IRouterOptions = {
  prefix: "/api"
};

export const router = new Router(routeOptions);
router.post("/indicators-datas", createIndicatorsData);
router.put("/indicators-datas/:id", updateIndicatorsData);
router.get("/indicators-datas/:id", getIndicatorsData);
router.post("/indicators-datas/:id/emails", sendEmail);
