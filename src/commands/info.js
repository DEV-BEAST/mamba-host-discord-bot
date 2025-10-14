import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('info')
  .setDescription('Get information about the bot or server')
  .addSubcommand(subcommand =>
    subcommand
      .setName('bot')
      .setDescription('Get information about the bot')
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('server')
      .setDescription('Get information about the server')
  );

export async function execute(interaction) {
  const subcommand = interaction.options.getSubcommand();

  if (subcommand === 'bot') {
    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle('Bot Information')
      .setThumbnail(interaction.client.user.displayAvatarURL())
      .addFields(
        { name: 'Bot Name', value: interaction.client.user.tag, inline: true },
        { name: 'Bot ID', value: interaction.client.user.id, inline: true },
        { name: 'Created', value: `<t:${Math.floor(interaction.client.user.createdTimestamp / 1000)}:R>`, inline: true },
        { name: 'Servers', value: `${interaction.client.guilds.cache.size}`, inline: true },
        { name: 'Users', value: `${interaction.client.users.cache.size}`, inline: true },
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  } else if (subcommand === 'server') {
    const { guild } = interaction;
    
    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle('Server Information')
      .setThumbnail(guild.iconURL())
      .addFields(
        { name: 'Server Name', value: guild.name, inline: true },
        { name: 'Server ID', value: guild.id, inline: true },
        { name: 'Owner', value: `<@${guild.ownerId}>`, inline: true },
        { name: 'Members', value: `${guild.memberCount}`, inline: true },
        { name: 'Created', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true },
        { name: 'Boost Level', value: `${guild.premiumTier}`, inline: true },
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
}
