import { getCustomCommand } from '../utils/database.js';

export async function handleCustomCommand(message, botConfig) {
  if (message.author.bot || !message.guild) return false;

  const prefix = botConfig.commandPrefix || '!';
  if (!message.content.startsWith(prefix)) return false;

  const name = message.content.slice(prefix.length).split(/\s+/)[0].toLowerCase();
  if (!name) return false;

  const cmd = await getCustomCommand(message.guild.id, name);
  if (!cmd) return false;

  const response = cmd.response
    .replace(/{user}/g, message.author.toString())
    .replace(/{server}/g, message.guild.name)
    .replace(/{channel}/g, message.channel.toString())
    .replace(/{memberCount}/g, String(message.guild.memberCount));

  await message.channel.send(response);
  return true;
}
