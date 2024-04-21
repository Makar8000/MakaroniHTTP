const discord = require('../util/discord.util');

const REG_REPLACE = [
  { regex: /\[charname:(?<charname>[^;\]]+)[^\]]*\]/g, replace: '$1' },
  { regex: /\[cmd:(?<charname>[^;\]]+)[^\]]*\]/g, replace: '<Recruit Group>' },
  { regex: /\[item: ?(?<itemId>[^;\]]+)[^\]]*\]/g, replace: '<https://aioncodex.com/usc/item/$1/>' },
];
const parseAionMessage = (msg) => {
  let ret = msg;
  REG_REPLACE.forEach(r => {
    ret = ret.replaceAll(r.regex, r.replace);
  });
  ret = `[<t:${Math.floor(Date.now() / 1000)}:T>] ${ret}`;
  return ret;
};

/**
 * Encapsulates the routes
 * @param {FastifyInstance} fastify  Encapsulated Fastify Instance
 * @param {Object} options plugin options, refer to https://www.fastify.io/docs/latest/Reference/Plugins/#plugin-options
 */
async function routes(fastify, options) {
  fastify.route({
    method: 'POST',
    url: '/aionChat',
    handler: async (req, reply) => {
      req.log.info('Auth route');
      const message = parseAionMessage(req.body.msg);
      const resp = await discord.sendChannelMessage(process.env.THREAD_ID, { content: message });
      reply.send({ success: true });
    },
  });
}

module.exports = routes;