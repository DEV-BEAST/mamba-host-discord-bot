import { get } from '../api.js';

let refreshTimer = null;

export function render(container) {
  container.innerHTML = `
    <div class="page-header">
      <h1>Overview</h1>
      <p>Bot statistics at a glance</p>
    </div>
    <div class="stats-grid" id="stats-grid"></div>
  `;
  loadStats();
  refreshTimer = setInterval(loadStats, 30000);
}

export function destroy() {
  if (refreshTimer) { clearInterval(refreshTimer); refreshTimer = null; }
}

async function loadStats() {
  const grid = document.getElementById('stats-grid');
  if (!grid) return;

  try {
    const s = await get('/api/stats');

    const uptime = formatUptime(s.uptime);

    grid.innerHTML = `
      ${statCard('Servers', s.guilds)}
      ${statCard('Users', s.users.toLocaleString())}
      ${statCard('Channels', s.channels)}
      ${statCard('Uptime', uptime)}
      ${statCard('Ping', s.ping + ' ms')}
      ${statCard('Memory', s.memory.heapUsed + ' MB')}
      ${statCard('Commands Run', s.commandsRun)}
      ${statCard('Node.js', s.nodeVersion)}
    `;
  } catch (err) {
    grid.innerHTML = `<div class="status-msg error">Failed to load stats: ${err.message}</div>`;
  }
}

function statCard(label, value) {
  return `<div class="stat-card"><div class="stat-value">${value}</div><div class="stat-label">${label}</div></div>`;
}

function formatUptime(ms) {
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
