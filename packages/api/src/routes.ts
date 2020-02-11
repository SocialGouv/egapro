import * as Router from "koa-router";
import {
  createIndicatorsData,
  getIndicatorsData,
  sendEmail,
  updateIndicatorsData,
  versionController,
  getStatsData
} from "./controller";

const routeOptions: Router.IRouterOptions = {
  prefix: "/api"
};

export const router = new Router(routeOptions);
router.get("/version", versionController.get);
router.post("/indicators-datas", createIndicatorsData);
router.put("/indicators-datas/:id", updateIndicatorsData);
router.get("/indicators-datas/:id", getIndicatorsData);
router.post("/indicators-datas/:id/emails", sendEmail);
router.get("/stats", getStatsData);
