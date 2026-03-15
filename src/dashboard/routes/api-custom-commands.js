import { Router } from 'express';
import { getCustomCommands, createCustomCommand, deleteCustomCommand } from '../../utils/database.js';

export function createCustomCommandsRouter() {
  const router = Router();

  // GET /api/custom-commands/:guildId
  router.get('/:guildId', async (req, res) => {
    const { botConfig } = req.app.locals;
    const { guildId } = req.params;
    try {
      const commands = await getCustomCommands(guildId);
      res.json({ commands, prefix: botConfig.commandPrefix || '!' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/custom-commands/:guildId
  router.post('/:guildId', async (req, res) => {
    const { guildId } = req.params;
    const { name, response } = req.body;

    if (!name || !response) return res.status(400).json({ error: 'Name and response are required' });

    const cleanName = name.toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (!cleanName) return res.status(400).json({ error: 'Invalid command name' });

    try {
      const id = await createCustomCommand(guildId, cleanName, response);
      res.json({ success: true, id });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // DELETE /api/custom-commands/:id
  router.delete('/:id', async (req, res) => {
    try {
      const deleted = await deleteCustomCommand(req.params.id);
      if (!deleted) return res.status(404).json({ error: 'Command not found' });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}
