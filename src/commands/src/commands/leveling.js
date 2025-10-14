import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';

const userXP = new Map();

function getUserData(guildId, userId) {
  const key = guildId + '-' + userId;
  if (!userXP.has(key)) {
    userXP.set(key, { xp: 0, level: 1, messages: 0 });
  }
  return userXP.get(key);
}

function calculateLevel(xp) {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

function xpForLevel(level) {
  return Math.pow(level - 1, 2) * 100;
}

export const data = new SlashCommandBuilder()
  .setName('level')
  .setDescription('Leveling and XP system')
  .addSubcommand(subcommand =>
    subcommand
      .setName('rank')
      .setDescription('Check your rank')
      .addUserOption(option =>
        option.setName('user')
          .setDescription('User to check')
          .setRequired(false)))
  .addSubcommand(subcommand =>
    subcommand
      .setName('leaderboard')
      .setDescription('View server leaderboard')
      .addIntegerOption(option =>
        option.setName('page')
          .setDescription('Page number')
          .setRequired(false)
          .setMinValue(1)))
  .addSubcommand(subcommand =>
    subcommand
      .setName('reset')
      .setDescription('Reset XP (Admin only)')
      .addUserOption(option =>
        option.setName('user')
          .setDescription('User to reset')
          .setRequired(true)));

export async function execute(interaction) {
  const subcommand = interaction.options.getSubcommand();
  const guildId = interaction.guild.id;
  
  if (subcommand === 'rank') {
    const user = interaction.options.getUser('user') || interaction.user;
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
      .setColor(0x5865F2)
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
  
  else if (subcommand === 'leaderboard') {
    const page = interaction.options.getInteger('page') || 1;
    const perPage = 10;
    
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
  
  else if (subcommand === 'reset') {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: '❌ Admin only!', ephemeral: true });
    }
    
    const user = interaction.options.getUser('user');
    const key = guildId + '-' + user.id;
    
    if (!userXP.has(key)) {
      return interaction.reply({ content: '❌ No XP data!', ephemeral: true });
    }
    
    userXP.delete(key);
    await interaction.reply({ content: '✅ Reset XP for ' + user.tag, ephemeral: true });
  }
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
  
  if (newLevel > oldLevel) {
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