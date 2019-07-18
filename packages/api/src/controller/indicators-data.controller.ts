import * as Koa from "koa";
import { IndicatorsData } from "../model";
import { Email, emailService, indicatorsDataService } from "../service";

export const createIndicatorsData = async (ctx: Koa.Context) => {
  const record: IndicatorsData = await indicatorsDataService.add();
  ctx.type = "application/json";
  if (record.id) {
    ctx.status = 201;
    ctx.body = { id: record.id };
  } else {
    throw new Error("entity creation failed!");
  }
};

export const updateIndicatorsData = async (ctx: Koa.Context) => {
  const id = ctx.params.id;
  const record = ctx.request.body;
  ctx.type = "application/json";
  if (record.id !== id) {
    ctx.status = 422;
    ctx.body = {
      message: `body.id not equal to id in params `
    };
  } else {
    const updatedRecord: IndicatorsData = await indicatorsDataService.update(
      record
    );
    ctx.status = updatedRecord ? 200 : 500;
    ctx.body = updatedRecord;
  }
};

export const getIndicatorsData = async (ctx: Koa.Context) => {
  const id = ctx.params.id;
  const record = await indicatorsDataService.one(id);
  ctx.type = "application/json";
  if (record) {
    ctx.status = 200;
    ctx.body = record;
  } else {
    ctx.status = 400;
    ctx.body = {
      message: `indicators_data with id ${id} does not exist`
    };
  }
};

export const sendEmail = async (ctx: Koa.Context) => {
  const id: string = ctx.params.id;
  const emailAddress: string = ctx.request.body.email;
  const record = await indicatorsDataService.one(id);
  ctx.type = "application/json";
  if (!record || !record.id) {
    ctx.status = 400;
    ctx.body = {
      message: `indicators_data with id ${id} does not exist`
    };
  } else {
    const email: Email = buildEmail(record.id, emailAddress);
    const response = await emailService.sendEmail(email);
    if (response.messageId) {
      ctx.status = 204;
    } else {
      ctx.status = 400;
      ctx.body = {};
    }
  }
};

function buildEmail(id: string, emailAddress: string) {
  const subject: string =
    "Calcul de l’index égalité professionnelle femmes-hommes";
  const body: string = `Bonjour,

Vous avez commencé votre calcul de l’Index de l’égalité professionnelle femmes-hommes.

Vous pouvez accéder aux données saisies en cliquant sur le lien suivant: https://index-egapro.travail.gouv.fr/simulateur/${id}


Bien cordialement,


Direction Générale du Travail`;
  return {
    bcc: [],
    bodyText: body,
    cci: [],
    subject,
    to: [{ email: emailAddress, name: emailAddress }]
  };
}
