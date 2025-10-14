import { 
  SlashCommandBuilder, 
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('ticket')
  .setDescription('Advanced ticket system')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
  .addSubcommand(subcommand =>
    subcommand
      .setName('setup')
      .setDescription('Setup ticket system in current channel')
      .addRoleOption(option =>
        option.setName('support-role')
          .setDescription('Role that can view tickets')
          .setRequired(true))
      .addChannelOption(option =>
        option.setName('category')
          .setDescription('Category for ticket channels')
          .setRequired(false)))
  .addSubcommand(subcommand =>
    subcommand
      .setName('close')
      .setDescription('Close the current ticket'))
  .addSubcommand(subcommand =>
    subcommand
      .setName('add')
      .setDescription('Add a user to the ticket')
      .addUserOption(option =>
        option.setName('user')
          .setDescription('User to add')
          .setRequired(true)))
  .addSubcommand(subcommand =>
    subcommand
      .setName('remove')
      .setDescription('Remove a user from the ticket')
      .addUserOption(option =>
        option.setName('user')
          .setDescription('User to remove')
          .setRequired(true)));

export async function execute(interaction) {
  const subcommand = interaction.options.getSubcommand();
  
  if (subcommand === 'setup') {
    const supportRole = interaction.options.getRole('support-role');
    const category = interaction.options.getChannel('category');
    
    const embed = new EmbedBuilder()
      .setColor(0xFF6F00)
      .setTitle('🎫 Mamba Host Support Tickets')
      .setDescription(
        'Need help? Create a support ticket!\n\n' +
        '**How it works:**\n' +
        '1. Click the button below\n' +
        '2. Fill out the ticket form\n' +
        '3. A private channel will be created\n' +
        '4. Our support team will assist you\n\n' +
        '**Response Times:**\n' +
        '🟢 High Priority: < 1 hour\n' +
        '🟡 Medium Priority: < 4 hours\n' +
        '🔴 Low Priority: < 24 hours'
      )
      .setFooter({ text: 'Mamba Host • Premium Support' })
      .setTimestamp();
    
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`create_ticket:${supportRole.id}:${category?.id || 'none'}`)
          .setLabel('Create Ticket')
          .setEmoji('🎫')
          .setStyle(ButtonStyle.Primary)
      );
    
    await interaction.reply({
      content: '✅ Ticket system has been set up!',
      ephemeral: true
    });
    
    await interaction.channel.send({ embeds: [embed], components: [row] });
  }
  
  else if (subcommand === 'close') {
    if (!interaction.channel.name.startsWith('ticket-')) {
      return interaction.reply({
        content: '❌ This command can only be used in ticket channels!',
        ephemeral: true
      });
    }

    const embed = new EmbedBuilder()
      .setColor(0xFF6B6B)
      .setTitle('🔒 Closing Ticket')
      .setDescription('This ticket will be closed in 5 seconds...')
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });

    // Store channel reference before deletion
    const channelToDelete = interaction.channel;

    setTimeout(async () => {
      try {
        await channelToDelete.delete();
      } catch (error) {
        console.error('Failed to delete ticket channel:', error);
        // Try to send error message if channel still exists
        try {
          await channelToDelete.send('❌ Failed to close ticket. Please contact an administrator.');
        } catch {
          // Channel might already be deleted or bot lacks permissions
        }
      }
    }, 5000);
  }
  
  else if (subcommand === 'add') {
    const user = interaction.options.getUser('user');
    
    if (!interaction.channel.name.startsWith('ticket-')) {
      return interaction.reply({
        content: '❌ This command can only be used in ticket channels!',
        ephemeral: true
      });
    }
    
    try {
      await interaction.channel.permissionOverwrites.create(user, {
        ViewChannel: true,
        SendMessages: true,
        ReadMessageHistory: true
      });
      
      await interaction.reply({
        content: `✅ Added ${user.toString()} to the ticket!`
      });
    } catch (error) {
      await interaction.reply({
        content: `❌ Failed to add user: ${error.message}`,
        ephemeral: true
      });
    }
  }
  
  else if (subcommand === 'remove') {
    const user = interaction.options.getUser('user');
    
    if (!interaction.channel.name.startsWith('ticket-')) {
      return interaction.reply({
        content: '❌ This command can only be used in ticket channels!',
        ephemeral: true
      });
    }
    
    try {
      await interaction.channel.permissionOverwrites.delete(user);
      
      await interaction.reply({
        content: `✅ Removed ${user.toString()} from the ticket!`
      });
    } catch (error) {
      await interaction.reply({
        content: `❌ Failed to remove user: ${error.message}`,
        ephemeral: true
      });
    }
  }
}