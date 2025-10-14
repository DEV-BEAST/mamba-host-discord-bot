import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('ping')
  .setDescription('Replies with Pong and latency!');

export async function execute(interaction) {
  const sent = await interaction.reply({ 
    content: 'Pinging...', 
    fetchReply: true 
  });
  
  const latency = sent.createdTimestamp - interaction.createdTimestamp;
  const apiLatency = Math.round(interaction.client.ws.ping);
  
  await interaction.editReply(
    `🏓 Pong!\n⏱️ Latency: ${latency}ms\n💓 API Latency: ${apiLatency}ms`
  );
}
