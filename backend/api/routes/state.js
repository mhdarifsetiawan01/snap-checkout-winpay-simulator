"use strict";

const { getKey } = require("../../helpers/storage");

/**
 * Routes State — Baca state transaksi terakhir dari db.json
 * @param {import('fastify').FastifyInstance} fastify
 */
async function stateRoutes(fastify) {
  fastify.get("/state", async (request, reply) => {
    const state = {
      lastContractId:        getKey("lastContractId")        || null,
      lastTrxId:             getKey("lastTrxId")             || null,
      lastVirtualAccountNo:  getKey("lastVirtualAccountNo")  || null,
      lastChannel:           getKey("lastChannel")           || null,
      lastPartnerReferenceNo: getKey("lastPartnerReferenceNo") || null,
      lastWebRedirectUrl:    getKey("lastWebRedirectUrl")    || null,
      lastAppRedirectUrl:    getKey("lastAppRedirectUrl")    || null,
      lastInvoiceId:         getKey("lastInvoiceId")         || null,
      lastInvoiceRef:        getKey("lastInvoiceRef")        || null,
      lastCallbackReceived:  getKey("lastCallbackReceived")  || null,
    };

    return reply.send({ success: true, data: state });
  });
}

module.exports = stateRoutes;
