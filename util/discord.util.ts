import { REST } from '@discordjs/rest';
import { type RESTPostAPIChannelMessageJSONBody, type RESTPostAPIChannelMessageResult, Routes } from 'discord-api-types/v10';

const rest = new REST({ version: '10' }).setToken(Deno.env.get('DISCORD_TOKEN') ?? '');

export const sendChannelMessage = async (
  channelId: string,
  body: RESTPostAPIChannelMessageJSONBody,
): Promise<RESTPostAPIChannelMessageResult | null> => {
  try {
    const response = await rest.post(Routes.channelMessages(channelId), { body });
    // fastify.log.info(`Sent content to channel <#${channelId}>`, body, response);
    return response as RESTPostAPIChannelMessageResult;
  } catch (_error) {
    // fastify.log.error(`Error sending content to channel <#${channelId}>`, body);
    return null;
  }
};
