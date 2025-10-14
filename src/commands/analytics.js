import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('analytics')
  .setDescription('Server analytics and statistics')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addSubcommand(subcommand =>
    subcommand
      .setName('overview')
      .setDescription('Get server overview statistics'));

export async function execute(interaction) {
  const subcommand = interaction.options.getSubcommand();
  await interaction.deferReply();
  
  if (subcommand === 'overview') {
    const guild = interaction.guild;
    const totalMembers = guild.memberCount;
    
    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle('Analytics Overview')
      .setDescription(`Total Members: ${totalMembers}`)
      .setTimestamp();
    
    await interaction.editReply({ embeds: [embed] });
  }
}