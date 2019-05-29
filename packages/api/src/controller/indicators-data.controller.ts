import * as Koa from 'koa';
import { IndicatorsData } from '../model';
import { Email, emailService, indicatorsDataService } from '../service';

export const createIndicatorsData = async (ctx: Koa.Context) => {
    const record: IndicatorsData = await indicatorsDataService.add();
    ctx.type = 'application/json';
    if (record.id) {
        ctx.status = 201;
        ctx.body = { id: record.id }
    } else {
        ctx.status = 500;
    }
}

export const updateIndicatorsData = async (ctx: Koa.Context) => {
    const record = ctx.request.body;
    const updatedRecord: IndicatorsData = await indicatorsDataService.update(record);
    ctx.type = 'application/json';
    ctx.status = updatedRecord ? 200 : 500;
    ctx.body = updatedRecord ? 'success' : 'error';
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

export const sendEmail = async (ctx: Koa.Context) => {
    const id: string = ctx.params.id;
    const emailAddress: string = ctx.request.body.email;
    const record = await indicatorsDataService.one(id);
    if (!record || !record.id) {
        ctx.status = 400;
        ctx.body = `indicators_data with id ${id} does not exist`;
    } else {
        const email: Email = buildEmail(record.id, emailAddress);
        const response = await emailService.sendEmail(email);
        ctx.status = response.messageId ? 200 : 400;
        ctx.body = response.messageId ? 'success' : 'error';
    }
}

function buildEmail(id: string, emailAddress: string) {
    const subject: string = 'EgaPro: Accéder au calculateur';
    const body: string = `Bonjour,
        
        Accéder au calculateur: ${id}

        L'équipe EgaPro`;
    return {
        bcc: [],
        bodyText: body,
        cci: [],
        subject,
        to: [{ email: emailAddress, name: emailAddress }]
    }
}