import * as Router from "koa-router";
import {
  createIndicatorsData,
  getIndicatorsData,
  getStatsData,
  searchIndicatorsData,
  sendStartEmail,
  sendSuccessEmail,
  updateIndicatorsData,
  versionController,
} from "./controller";

const routeOptions: Router.IRouterOptions = {
  prefix: "/api",
};

export const router = new Router(routeOptions);
router.get("/version", versionController.get);
router.post("/indicators-datas", createIndicatorsData);
router.put("/indicators-datas/:id", updateIndicatorsData);
router.get("/indicators-datas/:id", getIndicatorsData);
router.post("/indicators-datas/:id/emails", sendStartEmail);
router.post("/indicators-datas/:id/success-email", sendSuccessEmail);
router.get("/stats", getStatsData);
router.get("/search-indicators-data", searchIndicatorsData);
