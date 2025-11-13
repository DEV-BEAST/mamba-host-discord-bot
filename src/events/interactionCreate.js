import { EmbedBuilder, ChannelType, PermissionFlagsBits, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from 'discord.js';

export async function handleButtonInteraction(interaction) {
  const parts = interaction.customId.split(':');
  const action = parts[0];

  // Handle status refresh button
  if (interaction.customId === 'status_refresh') {
    const statusModule = await import('../commands/status.js');
    await statusModule.handleStatusButton(interaction);
    return;
  }

  if (action === 'create_ticket') {
    const supportRoleId = parts[1];
    const categoryId = parts[2];
    
    const modal = new ModalBuilder()
      .setCustomId('ticket_modal:' + supportRoleId + ':' + categoryId)
      .setTitle('Create Support Ticket');
    
    const subjectInput = new TextInputBuilder()
      .setCustomId('ticket_subject')
      .setLabel('Subject')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Brief description of your issue')
      .setRequired(true)
      .setMaxLength(100);
    
    const descriptionInput = new TextInputBuilder()
      .setCustomId('ticket_description')
      .setLabel('Detailed Description')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Please describe your issue in detail...')
      .setRequired(true)
      .setMaxLength(1000);
    
    const priorityInput = new TextInputBuilder()
      .setCustomId('ticket_priority')
      .setLabel('Priority (Low, Medium, High)')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Low')
      .setRequired(false)
      .setMaxLength(10);
    
    modal.addComponents(
      new ActionRowBuilder().addComponents(subjectInput),
      new ActionRowBuilder().addComponents(descriptionInput),
      new ActionRowBuilder().addComponents(priorityInput)
    );
    
    await interaction.showModal(modal);
  }
  
  else if (action === 'poll_vote') {
    const pollId = parts[1];
    const optionIndex = parseInt(parts[2]);
    
    const pollModule = await import('../commands/poll.js');
    const poll = pollModule.activePolls.get(pollId);
    
    if (!poll) {
      return interaction.reply({ content: '❌ This poll has ended!', ephemeral: true });
    }
    
    const userId = interaction.user.id;
    
    poll.votes.forEach((voters, idx) => {
      if (voters.has(userId) && idx !== optionIndex) {
        voters.delete(userId);
      }
    });
    
    if (!poll.votes.has(optionIndex)) {
      poll.votes.set(optionIndex, new Set());
    }
    
    const hasVoted = poll.votes.get(optionIndex).has(userId);
    
    if (hasVoted) {
      poll.votes.get(optionIndex).delete(userId);
      await interaction.reply({ content: '✅ Vote removed!', ephemeral: true });
    } else {
      poll.votes.get(optionIndex).add(userId);
      await interaction.reply({ content: '✅ Vote recorded!', ephemeral: true });
    }
    
    const totalVotes = Array.from(poll.votes.values()).reduce((sum, votes) => sum + votes.size, 0);
    const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
    
    let optionsText = poll.options.map((opt, idx) => {
      const votes = poll.votes.get(idx)?.size || 0;
      const percentage = totalVotes > 0 ? ' (' + (votes/totalVotes*100).toFixed(1) + '%)' : '';
      return emojis[idx] + ' ' + opt + ' - **' + votes + '** votes' + percentage;
    }).join('\n\n');
    
    optionsText += '\n\n**Total Votes:** ' + totalVotes;
    
    const embed = new EmbedBuilder()
      .setColor(0xFF6F00)
      .setTitle('📊 ' + poll.question)
      .setDescription(optionsText)
      .setFooter({ text: 'Poll ID: ' + pollId })
      .setTimestamp();
    
    await interaction.message.edit({ embeds: [embed] });
  }
}

export async function handleModalSubmit(interaction) {
  const parts = interaction.customId.split(':');
  const action = parts[0];
  
  if (action === 'ticket_modal') {
    const supportRoleId = parts[1];
    const categoryId = parts[2];
    
    const subject = interaction.fields.getTextInputValue('ticket_subject');
    const description = interaction.fields.getTextInputValue('ticket_description');
    const priority = interaction.fields.getTextInputValue('ticket_priority') || 'Low';
    
    await interaction.deferReply({ ephemeral: true });

    try {
      const ticketNumber = Math.floor(Math.random() * 9000) + 1000;
      const channelName = 'ticket-' + ticketNumber;

      const ticketChannel = await interaction.guild.channels.create({
        name: channelName,
        type: ChannelType.GuildText,
        parent: categoryId !== 'none' ? categoryId : null,
        topic: 'Ticket by ' + interaction.user.tag + ' | ' + subject,
        permissionOverwrites: [
          {
            id: interaction.guild.roles.everyone,
            deny: [PermissionFlagsBits.ViewChannel]
          },
          {
            id: interaction.user.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
          },
          {
            id: supportRoleId,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
          }
        ]
      });
      
      const priorityColors = { 'low': 0x4CAF50, 'medium': 0xFFC107, 'high': 0xFF6B6B };
      const priorityEmojis = { 'low': '🟢', 'medium': '🟡', 'high': '🔴' };
      
      const norm = priority.toLowerCase();
      const color = priorityColors[norm] || priorityColors['low'];
      const emoji = priorityEmojis[norm] || priorityEmojis['low'];
      
      const embed = new EmbedBuilder()
        .setColor(color)
        .setTitle('🎫 Ticket #' + ticketNumber)
        .setDescription('**Subject:** ' + subject + '\n\n**Description:**\n' + description + '\n\n**Priority:** ' + emoji + ' ' + priority)
        .addFields(
          { name: 'Created by', value: interaction.user.toString(), inline: true },
          { name: 'Created at', value: '<t:' + Math.floor(Date.now() / 1000) + ':F>', inline: true }
        )
        .setFooter({ text: 'Mamba Host Support' })
        .setTimestamp();
      
      await ticketChannel.send({ content: interaction.user.toString() + ' <@&' + supportRoleId + '>', embeds: [embed] });
      await interaction.editReply({ content: '✅ Ticket created! ' + ticketChannel.toString() });
    } catch (error) {
      console.error('Error creating ticket:', error);
      await interaction.editReply({ content: '❌ Failed to create ticket: ' + error.message });
    }
  }
}
