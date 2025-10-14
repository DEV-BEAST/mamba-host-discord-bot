import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getUserData, calculateLevel, xpForLevel } from './leveling.js';

export const data = new SlashCommandBuilder()
  .setName('rank')
  .setDescription('Check your rank or another user\'s rank')
  .addUserOption(option =>
    option.setName('user')
      .setDescription('User to check')
      .setRequired(false));

export async function execute(interaction) {
  const user = interaction.options.getUser('user') || interaction.user;
  const guildId = interaction.guild.id;
  const userData = getUserData(guildId, user.id);

  const currentLevel = calculateLevel(userData.xp);
  const nextLevel = currentLevel + 1;
  const xpForCurrentLevel = xpForLevel(currentLevel);
  const xpForNextLevel = xpForLevel(nextLevel);
  const xpProgress = userData.xp - xpForCurrentLevel;
  const xpNeeded = xpForNextLevel - xpForCurrentLevel;
  const progress = (xpProgress / xpNeeded * 100).toFixed(1);

  const barLength = 20;
  const filledLength = Math.round(barLength * xpProgress / xpNeeded);
  const progressBar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);

  const embed = new EmbedBuilder()
    .setColor(0xFF6F00)
    .setTitle('📊 ' + user.username + ' Rank')
    .setThumbnail(user.displayAvatarURL({ dynamic: true }))
    .addFields(
      { name: 'Level', value: String(currentLevel), inline: true },
      { name: 'Total XP', value: userData.xp.toLocaleString(), inline: true },
      { name: 'Messages', value: userData.messages.toLocaleString(), inline: true },
      { name: 'Progress', value: progressBar + '\n' + xpProgress + ' / ' + xpNeeded + ' XP (' + progress + '%)', inline: false }
    )
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
