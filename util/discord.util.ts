import { REST } from "@discordjs/rest";
import {
  type RESTPostAPIChannelMessageJSONBody,
  type RESTPostAPIChannelMessageResult,
  Routes,
} from "discord-api-types/v10";

const rest = new REST({ version: "10" }).setToken(Bun.env.DISCORD_TOKEN ?? "");

/** @throws when Discord rejects the message or can't be reached */
export const sendChannelMessage = async (
  channelId: string,
  body: RESTPostAPIChannelMessageJSONBody,
): Promise<RESTPostAPIChannelMessageResult> =>
  (await rest.post(Routes.channelMessages(channelId), { body })) as RESTPostAPIChannelMessageResult;
