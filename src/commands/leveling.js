import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { getUser, updateUser, deleteUser } from '../utils/database.js';

export async function getUserData(guildId, userId) {
  return await getUser(guildId, userId);
}

export function calculateLevel(xp) {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

export function xpForLevel(level) {
  return Math.pow(level - 1, 2) * 100;
}

export const data = new SlashCommandBuilder()
  .setName('resetxp')
  .setDescription('Reset a user\'s XP (Admin only)')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addUserOption(option =>
    option.setName('user')
      .setDescription('User to reset')
      .setRequired(true));

export async function execute(interaction) {
  const guildId = interaction.guild.id;
  const user = interaction.options.getUser('user');

  const deleted = await deleteUser(guildId, user.id);
  if (!deleted) {
    return interaction.reply({ content: '❌ No XP data found for this user!', ephemeral: true });
  }

  await interaction.reply({ content: '✅ Reset XP for ' + user.tag, ephemeral: true });
}

export async function handleMessageForXP(message) {
  if (message.author.bot || !message.guild) return;

  const guildId = message.guild.id;
  const userId = message.author.id;
  const userData = await getUserData(guildId, userId);

  const xpGain = Math.floor(Math.random() * 10) + 15;
  const oldLevel = calculateLevel(userData.xp);

  const newXp = userData.xp + xpGain;
  const newMessages = userData.messages + 1;
  await updateUser(guildId, userId, newXp, newMessages);

  const newLevel = calculateLevel(newXp);

  if (newLevel > oldLevel && newLevel % 5 === 0) {
    const embed = new EmbedBuilder()
      .setColor(0x4CAF50)
      .setTitle('🎉 Level Up!')
      .setDescription(message.author.toString() + ' reached **Level ' + newLevel + '**!')
      .setTimestamp();

    try {
      await message.channel.send({ embeds: [embed] });
    } catch (error) {
      console.error('Failed to send level up message:', error);
    }
  }
}
