import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';

export const userXP = new Map();

export function getUserData(guildId, userId) {
  const key = guildId + '-' + userId;
  if (!userXP.has(key)) {
    userXP.set(key, { xp: 0, level: 1, messages: 0 });
  }
  return userXP.get(key);
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
  const key = guildId + '-' + user.id;

  if (!userXP.has(key)) {
    return interaction.reply({ content: '❌ No XP data found for this user!', ephemeral: true });
  }

  userXP.delete(key);
  await interaction.reply({ content: '✅ Reset XP for ' + user.tag, ephemeral: true });
}

export async function handleMessageForXP(message) {
  if (message.author.bot || !message.guild) return;
  
  const guildId = message.guild.id;
  const userId = message.author.id;
  const userData = getUserData(guildId, userId);
  
  const xpGain = Math.floor(Math.random() * 10) + 15;
  const oldLevel = calculateLevel(userData.xp);
  
  userData.xp += xpGain;
  userData.messages += 1;
  
  const newLevel = calculateLevel(userData.xp);

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