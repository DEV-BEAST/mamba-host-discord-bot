import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { userXP, calculateLevel } from './leveling.js';

export const data = new SlashCommandBuilder()
  .setName('leaderboard')
  .setDescription('View the server leaderboard')
  .addIntegerOption(option =>
    option.setName('page')
      .setDescription('Page number')
      .setRequired(false)
      .setMinValue(1));

export async function execute(interaction) {
  const page = interaction.options.getInteger('page') || 1;
  const perPage = 10;
  const guildId = interaction.guild.id;

  const allUsers = Array.from(userXP.entries())
    .filter(([key]) => key.startsWith(guildId + '-'))
    .sort((a, b) => b[1].xp - a[1].xp);

  const totalPages = Math.ceil(allUsers.length / perPage);
  const startIdx = (page - 1) * perPage;
  const pageUsers = allUsers.slice(startIdx, startIdx + perPage);

  if (pageUsers.length === 0) {
    return interaction.reply({ content: '❌ No users found!', ephemeral: true });
  }

  const leaderboardText = await Promise.all(
    pageUsers.map(async ([key, data], idx) => {
      const userId = key.split('-')[1];
      try {
        const user = await interaction.client.users.fetch(userId);
        const level = calculateLevel(data.xp);
        const rank = startIdx + idx + 1;
        const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '   ';
        return medal + ' **' + rank + '.** ' + user.tag + '\n    Level ' + level + ' • ' + data.xp.toLocaleString() + ' XP';
      } catch {
        return null;
      }
    })
  );

  const filtered = leaderboardText.filter(entry => entry !== null);

  const embed = new EmbedBuilder()
    .setColor(0xFFD700)
    .setTitle('🏆 Leaderboard')
    .setDescription(filtered.join('\n\n'))
    .setFooter({ text: 'Page ' + page + '/' + totalPages })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
