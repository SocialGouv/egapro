import * as Koa from "koa";
import { statsDataService } from "../service";

export const getStatsData = async (ctx: Koa.Context) => {
  const response = await statsDataService.get();
  ctx.type = "application/json";
  if (response) {
    ctx.status = 200;
    ctx.body = response;
  } else {
    ctx.status = 400;
    ctx.body = {
      message: "could not retrieve stats"
    };
  }
};
