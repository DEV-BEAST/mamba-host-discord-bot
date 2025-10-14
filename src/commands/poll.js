import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('poll')
  .setDescription('Create advanced polls')
  .addSubcommand(subcommand =>
    subcommand
      .setName('create')
      .setDescription('Create a new poll')
      .addStringOption(option =>
        option.setName('question')
          .setDescription('The poll question')
          .setRequired(true))
      .addStringOption(option =>
        option.setName('options')
          .setDescription('Poll options separated by | (e.g., Yes|No|Maybe)')
          .setRequired(true))
      .addIntegerOption(option =>
        option.setName('duration')
          .setDescription('Poll duration in minutes')
          .setRequired(false)
          .setMinValue(1)
          .setMaxValue(10080))
      .addBooleanOption(option =>
        option.setName('anonymous')
          .setDescription('Hide who voted for what')
          .setRequired(false)))
  .addSubcommand(subcommand =>
    subcommand
      .setName('end')
      .setDescription('End an active poll')
      .addStringOption(option =>
        option.setName('message-id')
          .setDescription('Message ID of the poll')
          .setRequired(true)));

const activePolls = new Map();

export async function execute(interaction) {
  const subcommand = interaction.options.getSubcommand();
  
  if (subcommand === 'create') {
    const question = interaction.options.getString('question');
    const optionsStr = interaction.options.getString('options');
    const duration = interaction.options.getInteger('duration');
    const anonymous = interaction.options.getBoolean('anonymous') || false;
    
    const options = optionsStr.split('|').map(o => o.trim()).filter(o => o.length > 0);
    
    if (options.length < 2) {
      return interaction.reply({ content: '❌ You need at least 2 options for a poll!', ephemeral: true });
    }
    
    if (options.length > 10) {
      return interaction.reply({ content: '❌ Maximum 10 options allowed!', ephemeral: true });
    }
    
    const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
    const pollId = Date.now().toString();
    const endTime = duration ? Date.now() + (duration * 60 * 1000) : null;
    
    let description = options.map((opt, idx) => emojis[idx] + ' ' + opt).join('\n\n');
    description += '\n\n**Votes:** 0';
    
    if (endTime) {
      description += '\n**Ends:** <t:' + Math.floor(endTime / 1000) + ':R>';
    } else {
      description += '\n**Duration:** Unlimited';
    }
    
    description += anonymous ? '\n**Mode:** Anonymous 🔒' : '\n**Mode:** Public';
    
    const embed = new EmbedBuilder()
      .setColor(0xFF6F00)
      .setTitle('📊 ' + question)
      .setDescription(description)
      .setFooter({ text: 'Poll ID: ' + pollId + ' • Created by ' + interaction.user.tag })
      .setTimestamp();
    
    const rows = [];
    for (let i = 0; i < options.length; i += 5) {
      const row = new ActionRowBuilder();
      for (let j = i; j < Math.min(i + 5, options.length); j++) {
        const opt = options[j];
        const label = opt.length > 80 ? opt.substring(0, 77) + '...' : opt;
        row.addComponents(
          new ButtonBuilder()
            .setCustomId('poll_vote:' + pollId + ':' + j)
            .setLabel(label)
            .setEmoji(emojis[j])
            .setStyle(ButtonStyle.Secondary)
        );
      }
      rows.push(row);
    }
    
    await interaction.reply({ content: '✅ Poll created!', ephemeral: true });
    
    const message = await interaction.channel.send({ embeds: [embed], components: rows });
    
    activePolls.set(pollId, {
      messageId: message.id,
      channelId: interaction.channel.id,
      question: question,
      options: options,
      votes: new Map(),
      voters: new Set(),
      endTime: endTime,
      anonymous: anonymous,
      creatorId: interaction.user.id
    });
    
    if (endTime) {
      setTimeout(() => {
        endPoll(pollId, interaction.client);
      }, duration * 60 * 1000);
    }
  }
  
  else if (subcommand === 'end') {
    const messageId = interaction.options.getString('message-id');
    const poll = Array.from(activePolls.entries()).find(([, p]) => p.messageId === messageId);
    
    if (!poll) {
      return interaction.reply({ content: '❌ Poll not found or already ended!', ephemeral: true });
    }
    
    const [pollId, pollData] = poll;
    
    if (pollData.creatorId !== interaction.user.id) {
      return interaction.reply({ content: '❌ Only the poll creator can end this poll!', ephemeral: true });
    }
    
    await endPoll(pollId, interaction.client);
    await interaction.reply({ content: '✅ Poll ended!', ephemeral: true });
  }
}

async function endPoll(pollId, client) {
  const poll = activePolls.get(pollId);
  if (!poll) return;
  
  try {
    const channel = await client.channels.fetch(poll.channelId);
    const message = await channel.messages.fetch(poll.messageId);
    
    const totalVotes = Array.from(poll.votes.values()).reduce((sum, votes) => sum + votes.size, 0);
    
    const results = poll.options.map((opt, idx) => {
      const votes = poll.votes.get(idx)?.size || 0;
      const percentage = totalVotes > 0 ? (votes / totalVotes * 100).toFixed(1) : 0;
      const barLength = 20;
      const filledLength = Math.round(barLength * votes / Math.max(totalVotes, 1));
      const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);
      
      return '**' + opt + '**\n' + bar + ' ' + votes + ' votes (' + percentage + '%)';
    }).join('\n\n');
    
    const winnerIdx = Array.from(poll.votes.entries())
      .reduce((max, [idx, votes]) => votes.size > (poll.votes.get(max)?.size || 0) ? idx : max, 0);
    
    const embed = new EmbedBuilder()
      .setColor(0x4CAF50)
      .setTitle('📊 ' + poll.question + ' [ENDED]')
      .setDescription(results + '\n\n**Total Votes:** ' + totalVotes + '\n**Winner:** ' + poll.options[winnerIdx] + ' 🏆')
      .setFooter({ text: 'Poll ID: ' + pollId })
      .setTimestamp();
    
    await message.edit({ embeds: [embed], components: [] });
    activePolls.delete(pollId);
  } catch (error) {
    console.error('Error ending poll:', error);
  }
}

export { activePolls };