import * as Router from "koa-router";
import {
  createIndicatorsData,
  getIndicatorsData,
  getStatsData,
  sendEmail,
  updateIndicatorsData,
  versionController
} from "./controller";
import { getMatchingCompaniesIndicatorsData } from "./controller/authenticated-indicators-data.controller";
import { authenticate } from "./util/authenticate-middleware";

const authenticationToken = process.env.AUTHENTICATION_TOKEN;

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

const authenticatedRoutes = new Router({ prefix: "/auth" });
authenticatedRoutes.use(authenticate({ token: authenticationToken }));
authenticatedRoutes.get("/", ctx => (ctx.status = 204));
authenticatedRoutes.get(
  "/indicators-datas",
  getMatchingCompaniesIndicatorsData
);
router.use(authenticatedRoutes.routes());
