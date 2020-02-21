import * as Koa from "koa";
import { indicatorsDataService } from "../service/indicators-data";

export const getMatchingCompaniesIndicatorsData = async (ctx: Koa.Context) => {
  const partialCompanyName: string = ctx.query.partialCompanyName;
  const record = await indicatorsDataService.find(partialCompanyName);
  ctx.status = 200;
  ctx.body = record;
};
