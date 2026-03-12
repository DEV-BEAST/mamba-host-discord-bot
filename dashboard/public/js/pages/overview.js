import { html } from 'htm/preact';
import { useState, useEffect, useCallback } from 'preact/hooks';
import { get } from '../api.js';

function formatUptime(ms) {
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return d + 'd ' + h + 'h ' + m + 'm';
  if (h > 0) return h + 'h ' + m + 'm';
  return m + 'm';
}

function StatCard({ label, value }) {
  return html`
    <div class="bg-card rounded-lg p-5">
      <div class="text-[28px] font-bold text-foreground">${value}</div>
      <div class="text-xs text-muted-foreground mt-0.5">${label}</div>
    </div>
  `;
}

export default function Overview() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  const loadStats = useCallback(async () => {
    try {
      const s = await get('/api/stats');
      setStats(s);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    loadStats();
    const timer = setInterval(loadStats, 30000);
    return () => clearInterval(timer);
  }, [loadStats]);

  return html`
    <div class="mb-6">
      <h1 class="text-[22px] font-bold">Overview</h1>
      <p class="text-muted-foreground text-sm mt-0.5">Bot statistics at a glance</p>
    </div>

    ${error && html`
      <sl-alert variant="danger" open class="mb-4">
        <span>Failed to load stats: ${error}</span>
      </sl-alert>
    `}

    ${stats && html`
      <div class="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
        <${StatCard} label="Servers" value=${stats.guilds} />
        <${StatCard} label="Users" value=${stats.users.toLocaleString()} />
        <${StatCard} label="Channels" value=${stats.channels} />
        <${StatCard} label="Uptime" value=${formatUptime(stats.uptime)} />
        <${StatCard} label="Ping" value=${stats.ping + ' ms'} />
        <${StatCard} label="Memory" value=${stats.memory.heapUsed + ' MB'} />
        <${StatCard} label="Commands Run" value=${stats.commandsRun} />
        <${StatCard} label="Node.js" value=${stats.nodeVersion} />
      </div>
    `}

    ${!stats && !error && html`
      <div class="flex justify-center py-12">
        <sl-spinner style="font-size: 2rem; --indicator-color: #FF6F00;"></sl-spinner>
      </div>
    `}
  `;
}
