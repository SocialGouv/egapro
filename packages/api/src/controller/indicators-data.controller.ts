import * as Koa from 'koa';
import { IndicatorsData } from '../model';
import { indicatorsDataService } from '../service/indicators-data';

export const createIndicatorsData = async (ctx: Koa.Context) => {
    const email = ctx.request.body.email;
    const record: IndicatorsData = await indicatorsDataService.add(email);
    ctx.type = 'application/json';
    if (record.id) {
        ctx.status = 201;
        ctx.body = record.id
    } else {
        ctx.status = 500;
    }
}

export const updateIndicatorsData = async (ctx: Koa.Context) => {
    const record = ctx.request.body;
    const updatedRecord: IndicatorsData = await indicatorsDataService.update(record);
    ctx.type = 'application/json';
    ctx.status = updatedRecord ? 200 : 500;
}

export const getIndicatorsData = async (ctx: Koa.Context) => {
    const id = ctx.params.id;
    const record = await indicatorsDataService.one(id);
    if (record) {
        ctx.status = 200;
        ctx.body = record
    } else {
        ctx.status = 400;
        ctx.body = `indicators_data with id ${id} does not exist`
    }
}