import { get } from '../api.js';

export function render(container) {
  container.innerHTML = `
    <div class="page-header">
      <h1>Leaderboard</h1>
      <p>XP rankings by server</p>
    </div>
    <div class="card">
      <div class="form-group">
        <label>Select Guild</label>
        <select id="lb-guild"><option value="">Select a server...</option></select>
      </div>
      <div id="lb-content"></div>
    </div>
  `;

  loadGuilds();
  document.getElementById('lb-guild').addEventListener('change', (e) => {
    if (e.target.value) loadLeaderboard(e.target.value);
    else document.getElementById('lb-content').innerHTML = '';
  });
}

export function destroy() {}

async function loadGuilds() {
  try {
    const guilds = await get('/api/guilds');
    const sel = document.getElementById('lb-guild');
    sel.innerHTML = '<option value="">Select a server...</option>' +
      guilds.map(g => `<option value="${g.id}">${g.name}</option>`).join('');

    // Auto-select first guild
    if (guilds.length > 0) {
      sel.value = guilds[0].id;
      loadLeaderboard(guilds[0].id);
    }
  } catch (err) {
    document.getElementById('lb-content').innerHTML = `<div class="status-msg error">${err.message}</div>`;
  }
}

async function loadLeaderboard(guildId) {
  const content = document.getElementById('lb-content');
  content.innerHTML = '<p class="text-muted">Loading...</p>';

  try {
    const data = await get(`/api/leaderboard/${guildId}`);

    if (data.leaderboard.length === 0) {
      content.innerHTML = '<p class="text-muted">No XP data yet. Users earn XP by sending messages.</p>';
      return;
    }

    const rows = data.leaderboard.map(u => {
      const medal = u.rank === 1 ? '<span class="medal">🥇</span>'
        : u.rank === 2 ? '<span class="medal">🥈</span>'
        : u.rank === 3 ? '<span class="medal">🥉</span>' : '';

      const avatar = u.avatar
        ? `<img class="user-avatar" src="${u.avatar}" alt="">`
        : `<div class="user-avatar" style="background:var(--bg-lighter);border-radius:50%"></div>`;

      return `<tr>
        <td class="rank">${medal || u.rank}</td>
        <td><div class="user-cell">${avatar}<span>${escapeHtml(u.displayName)}</span></div></td>
        <td>${u.level}</td>
        <td class="xp-value">${u.xp.toLocaleString()}</td>
        <td>${u.messages.toLocaleString()}</td>
      </tr>`;
    }).join('');

    content.innerHTML = `
      <table class="lb-table">
        <thead><tr>
          <th>Rank</th><th>User</th><th>Level</th><th>XP</th><th>Messages</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  } catch (err) {
    content.innerHTML = `<div class="status-msg error">${err.message}</div>`;
  }
}

function escapeHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}
