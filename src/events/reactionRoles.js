import { getReactionRoleByMessageAndEmoji } from '../utils/database.js';

function resolveEmoji(reaction) {
  // Custom emoji: use id, unicode emoji: use the emoji character
  return reaction.emoji.id || reaction.emoji.name;
}

export async function handleReactionAdd(reaction, user) {
  if (user.bot) return;

  // Fetch partial reactions/messages
  if (reaction.partial) {
    try { await reaction.fetch(); } catch { return; }
  }

  const emoji = resolveEmoji(reaction);
  const mapping = await getReactionRoleByMessageAndEmoji(reaction.message.id, emoji);
  if (!mapping) return;

  try {
    const guild = reaction.message.guild;
    const member = await guild.members.fetch(user.id);
    await member.roles.add(mapping.role_id);
  } catch (err) {
    console.error('Failed to add reaction role:', err.message);
  }
}

export async function handleReactionRemove(reaction, user) {
  if (user.bot) return;

  if (reaction.partial) {
    try { await reaction.fetch(); } catch { return; }
  }

  const emoji = resolveEmoji(reaction);
  const mapping = await getReactionRoleByMessageAndEmoji(reaction.message.id, emoji);
  if (!mapping) return;

  try {
    const guild = reaction.message.guild;
    const member = await guild.members.fetch(user.id);
    await member.roles.remove(mapping.role_id);
  } catch (err) {
    console.error('Failed to remove reaction role:', err.message);
  }
}
