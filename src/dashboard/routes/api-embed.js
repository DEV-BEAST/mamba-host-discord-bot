import { Router } from 'express';
import { EmbedBuilder, AttachmentBuilder } from 'discord.js';

export function createEmbedRouter() {
  const router = Router();

  // POST /api/embed/send
  router.post('/send', async (req, res) => {
    const { client } = req.app.locals;
    const {
      channelId,
      author,
      title,
      url,
      description,
      color,
      fields,
      thumbnail,
      image,
      footer,
      timestamp,
      attachments,
    } = req.body;

    if (!channelId) {
      return res.status(400).json({ error: 'channelId is required' });
    }

    const channel = client.channels.cache.get(channelId);
    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    try {
      const embed = new EmbedBuilder();

      if (author && author.name) {
        embed.setAuthor({
          name: author.name,
          iconURL: author.iconURL || undefined,
          url: author.url || undefined,
        });
      }

      if (title) embed.setTitle(title);
      if (url) embed.setURL(url);
      if (description) embed.setDescription(description);
      if (color) embed.setColor(parseInt(color.replace('#', ''), 16));

      if (fields && fields.length > 0) {
        for (const field of fields) {
          if (field.name && field.value) {
            embed.addFields({
              name: field.name,
              value: field.value,
              inline: !!field.inline,
            });
          }
        }
      }

      if (thumbnail) embed.setThumbnail(thumbnail);
      if (image) embed.setImage(image);

      if (footer && footer.text) {
        embed.setFooter({
          text: footer.text,
          iconURL: footer.iconURL || undefined,
        });
      }

      if (timestamp) embed.setTimestamp();

      // Build message payload
      const messagePayload = { embeds: [embed] };

      // Handle file attachments (base64 encoded)
      if (attachments && attachments.length > 0) {
        messagePayload.files = attachments.map(att => {
          const buffer = Buffer.from(att.data, 'base64');
          return new AttachmentBuilder(buffer, { name: att.name });
        });
      }

      await channel.send(messagePayload);
      res.json({ success: true });
    } catch (error) {
      console.error('Error sending embed:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/embed/extract?guildId=...&channelId=...&messageId=...
  router.get('/extract', async (req, res) => {
    const { client } = req.app.locals;
    const { guildId, channelId, messageId } = req.query;

    if (!guildId || !channelId || !messageId) {
      return res.status(400).json({ error: 'guildId, channelId, and messageId are required' });
    }

    try {
      const guild = client.guilds.cache.get(guildId);
      if (!guild) return res.status(404).json({ error: 'Guild not found (bot may not be in this server)' });

      const channel = guild.channels.cache.get(channelId);
      if (!channel) return res.status(404).json({ error: 'Channel not found' });

      const message = await channel.messages.fetch(messageId);
      if (!message) return res.status(404).json({ error: 'Message not found' });

      const embed = message.embeds[0];
      if (!embed) return res.status(404).json({ error: 'No embed found in this message' });

      res.json({
        author: embed.author ? {
          name: embed.author.name || '',
          iconURL: embed.author.iconURL || '',
          url: embed.author.url || '',
        } : undefined,
        title: embed.title || '',
        url: embed.url || '',
        description: embed.description || '',
        color: embed.color || 0,
        fields: (embed.fields || []).map(f => ({
          name: f.name,
          value: f.value,
          inline: !!f.inline,
        })),
        thumbnail: embed.thumbnail?.url || '',
        image: embed.image?.url || '',
        footer: embed.footer ? {
          text: embed.footer.text || '',
          iconURL: embed.footer.iconURL || '',
        } : undefined,
        timestamp: !!embed.timestamp,
      });
    } catch (error) {
      console.error('Error extracting embed:', error);
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}
