import * as Koa from "koa";
import { pick } from "lodash";
import { IndicatorsData } from "../model";
import { request } from "../repository/elastic-search";
import { Email, emailService, indicatorsDataService } from "../service";
import { successEmail } from "../templates";
import { stringReplacer } from "../util/replace-in-string";

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
      message: `body.id not equal to id in params `,
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
      message: `indicators_data with id ${id} does not exist`,
    };
  }
};

// interface SearchIndicatorsDataQuery {
//   companyName: string;
//   size: string;
//   from: string;
//
// }

export const searchIndicatorsData = async (ctx: Koa.Context) => {
  const companyName: string = ctx.query.companyName;
  const size: number = +ctx.query.size;
  const from: number = +ctx.query.from;
  const sortBy: string = ctx.query.sortBy;
  const order: string = ctx.query.order;
  const { data, total } = await request(companyName, {
    from,
    order,
    size,
    sortBy,
  });
  const response = data.map((indicatorsData: IndicatorsData) =>
    pick(indicatorsData, [
      "id",
      "data.informationsEntreprise.entreprisesUES",
      "data.informationsEntreprise.nomEntreprise",
      "data.informationsEntreprise.siren",
      "data.informationsEntreprise.structure",
      "data.informationsEntreprise.nomUES",
      "data.informationsEntreprise.region",
      "data.informationsEntreprise.departement",
      "data.informations.anneeDeclaration",
      "data.declaration.noteIndex",
    ])
  );
  ctx.status = 200;
  ctx.body = {
    data: response,
    total,
  };
};

export const sendStartEmail = async (ctx: Koa.Context) => {
  const id: string = ctx.params.id;
  const emailAddress: string = ctx.request.body.email;
  const record = await indicatorsDataService.one(id);
  ctx.type = "application/json";
  if (!record || !record.id) {
    ctx.status = 400;
    ctx.body = {
      message: `indicators_data with id ${id} does not exist`,
    };
  } else {
    const email: Email = buildStartEmail(record.id, emailAddress);
    const response = await emailService.sendEmail(email);
    if (response.messageId) {
      ctx.status = 204;
    } else {
      ctx.status = 400;
      ctx.body = {};
    }
  }
};

export const sendSuccessEmail = async (ctx: Koa.Context) => {
  const id: string = ctx.params.id;
  const record = await indicatorsDataService.one(id);
  ctx.type = "application/json";
  if (!record || !record.id) {
    ctx.status = 400;
    ctx.body = {
      message: `indicators_data with id ${id} does not exist`,
    };
  } else {
    const companyName = record.data.informationsEntreprise.nomEntreprise || "";
    const anneeDeclaration = record.data.informations.anneeDeclaration || "";
    const emailAddress = record.data.informationsDeclarant.email;
    const email: Email = buildSuccessEmail(
      record.id,
      companyName,
      emailAddress,
      anneeDeclaration
    );
    const response = await emailService.sendEmail(email);
    if (response.messageId) {
      ctx.status = 204;
    } else {
      ctx.status = 400;
      ctx.body = {};
    }
  }
};

interface EmailTarget {
  email: string;
  name: string;
}

interface EmailHeader {
  bcc: EmailTarget[];
  cci: EmailTarget[];
  subject: string;
  to: EmailTarget[];
}

function buildEmailHeader(emailAddress: string): EmailHeader {
  const subject = "Calcul de l’index égalité professionnelle femmes-hommes";

  return {
    bcc: [],
    cci: [],
    subject,
    to: [{ email: emailAddress, name: emailAddress }],
  };
}

function buildStartEmail(id: string, emailAddress: string): Email {
  const body: string = `Bonjour,

Vous avez commencé votre calcul de l’Index de l’égalité professionnelle femmes-hommes.

Vous pouvez accéder aux données saisies en cliquant sur le lien suivant: https://index-egapro.travail.gouv.fr/simulateur/${id}


Bien cordialement,


Direction Générale du Travail`;
  return {
    ...buildEmailHeader(emailAddress),
    bodyText: body,
  };
}

function buildSuccessEmail(
  id: string,
  companyName: string,
  emailAddress: string,
  anneeIndicateur: string
): Email {
  return {
    ...buildEmailHeader(emailAddress),
    bodyText: stringReplacer(successEmail.text, {
      anneeIndicateur,
      companyName,
      id,
    }),
    html: stringReplacer(successEmail.html, {
      anneeIndicateur,
      companyName,
      id,
    }),
  };
}
