import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('hello')
  .setDescription('Says hello to you!')
  .addStringOption(option =>
    option
      .setName('name')
      .setDescription('Your name')
      .setRequired(false)
  );

export async function execute(interaction) {
  const name = interaction.options.getString('name') || interaction.user.username;
  await interaction.reply(`👋 Hello, ${name}!`);
}
