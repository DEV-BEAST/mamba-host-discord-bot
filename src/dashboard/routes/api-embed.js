import { Router } from 'express';
import { EmbedBuilder } from 'discord.js';

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

      await channel.send({ embeds: [embed] });
      res.json({ success: true });
    } catch (error) {
      console.error('Error sending embed:', error);
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}
