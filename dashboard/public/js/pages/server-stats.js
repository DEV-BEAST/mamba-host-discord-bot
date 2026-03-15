import { html } from 'htm/preact';
import { useState, useEffect, useRef, useCallback } from 'preact/hooks';
import { get } from '../api.js';
import { useShoelaceEvent } from '../hooks/useShoelace.js';

const CHART_COLORS = {
  accent: '#FF6F00',
  accentLight: 'rgba(255, 111, 0, 0.3)',
  grid: '#3f4147',
  text: '#949ba4',
  green: '#23a559',
  greenLight: 'rgba(35, 165, 89, 0.3)',
  blue: '#5865f2',
  blueLight: 'rgba(88, 101, 242, 0.3)',
};

const CHART_DEFAULTS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
  },
  scales: {
    x: {
      grid: { color: CHART_COLORS.grid },
      ticks: { color: CHART_COLORS.text, maxTicksLimit: 10 },
    },
    y: {
      grid: { color: CHART_COLORS.grid },
      ticks: { color: CHART_COLORS.text },
      beginAtZero: true,
    },
  },
};

export default function ServerStats() {
  const [guilds, setGuilds] = useState([]);
  const [guildId, setGuildId] = useState('');
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(false);

  // Stats
  const [overview, setOverview] = useState(null);
  const [messageData, setMessageData] = useState([]);
  const [channelData, setChannelData] = useState([]);

  // Chart refs
  const memberChartRef = useRef(null);
  const messageChartRef = useRef(null);
  const channelChartRef = useRef(null);
  const memberChartInstance = useRef(null);
  const messageChartInstance = useRef(null);
  const channelChartInstance = useRef(null);

  const guildRef = useRef(null);
  const daysRef = useRef(null);

  useShoelaceEvent(guildRef, 'sl-change', useCallback(e => setGuildId(e.target.value), []));
  useShoelaceEvent(daysRef, 'sl-change', useCallback(e => setDays(Number(e.target.value)), []));

  useEffect(() => {
    get('/api/guilds')
      .then(g => { setGuilds(g); if (g.length > 0) setGuildId(g[0].id); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!guildId) return;
    setLoading(true);
    Promise.all([
      get(`/api/server-stats/${guildId}/overview?days=${days}`),
      get(`/api/server-stats/${guildId}/messages?days=${days}`),
      get(`/api/server-stats/${guildId}/channels?days=${days}`),
    ])
      .then(([ov, msgs, chs]) => {
        setOverview(ov);
        setMessageData(msgs);
        setChannelData(chs);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [guildId, days]);

  // Render charts when data changes
  useEffect(() => {
    if (!overview || typeof Chart === 'undefined') return;
    renderMemberChart();
  }, [overview]);

  useEffect(() => {
    if (!messageData.length || typeof Chart === 'undefined') return;
    renderMessageChart();
  }, [messageData]);

  useEffect(() => {
    if (!channelData.length || typeof Chart === 'undefined') return;
    renderChannelChart();
  }, [channelData]);

  // Cleanup charts on unmount
  useEffect(() => {
    return () => {
      memberChartInstance.current?.destroy();
      messageChartInstance.current?.destroy();
      channelChartInstance.current?.destroy();
    };
  }, []);

  function renderMemberChart() {
    if (!memberChartRef.current || !overview?.memberHistory?.length) return;
    memberChartInstance.current?.destroy();

    const labels = overview.memberHistory.map(h => new Date(h.date).toLocaleDateString());
    const data = overview.memberHistory.map(h => h.members);

    memberChartInstance.current = new Chart(memberChartRef.current, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Members',
          data,
          borderColor: CHART_COLORS.accent,
          backgroundColor: CHART_COLORS.accentLight,
          fill: true,
          tension: 0.3,
          pointRadius: 2,
        }],
      },
      options: { ...CHART_DEFAULTS },
    });
  }

  function renderMessageChart() {
    if (!messageChartRef.current || !messageData.length) return;
    messageChartInstance.current?.destroy();

    const labels = messageData.map(d => new Date(d.date).toLocaleDateString());
    const data = messageData.map(d => d.count);

    messageChartInstance.current = new Chart(messageChartRef.current, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Messages',
          data,
          backgroundColor: CHART_COLORS.green,
          borderRadius: 3,
        }],
      },
      options: { ...CHART_DEFAULTS },
    });
  }

  function renderChannelChart() {
    if (!channelChartRef.current || !channelData.length) return;
    channelChartInstance.current?.destroy();

    const labels = channelData.map(c => '#' + c.channelName);
    const data = channelData.map(c => c.count);

    channelChartInstance.current = new Chart(channelChartRef.current, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Messages',
          data,
          backgroundColor: CHART_COLORS.blue,
          borderRadius: 3,
        }],
      },
      options: {
        ...CHART_DEFAULTS,
        indexAxis: 'y',
      },
    });
  }

  const activeChannelCount = channelData.length;

  return html`
    <div class="mb-6">
      <h1 class="text-[22px] font-bold">Server Stats</h1>
      <p class="text-muted-foreground text-sm mt-0.5">View server activity and growth over time</p>
    </div>

    <!-- Controls -->
    <div class="bg-card rounded-lg p-5 shadow-card mb-5">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block mb-1.5 text-[13px] font-medium text-text-secondary">Select Guild</label>
          <sl-select ref=${guildRef} value=${guildId} placeholder="Select a server..." size="medium" hoist>
            ${guilds.map(g => html`<sl-option value=${g.id}>${g.name}</sl-option>`)}
          </sl-select>
        </div>
        <div>
          <label class="block mb-1.5 text-[13px] font-medium text-text-secondary">Time Period</label>
          <sl-select ref=${daysRef} value=${String(days)} size="medium" hoist>
            <sl-option value="7">Last 7 days</sl-option>
            <sl-option value="14">Last 14 days</sl-option>
            <sl-option value="30">Last 30 days</sl-option>
          </sl-select>
        </div>
      </div>
    </div>

    ${loading && html`
      <div class="flex justify-center py-12">
        <sl-spinner style="font-size: 2rem;"></sl-spinner>
      </div>
    `}

    ${!loading && overview && html`
      <!-- Stat Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        <div class="bg-card rounded-lg p-5 shadow-card">
          <div class="text-muted-foreground text-[12px] uppercase tracking-wider font-medium mb-1">Members</div>
          <div class="text-[28px] font-bold text-accent">${overview.memberCount.toLocaleString()}</div>
        </div>
        <div class="bg-card rounded-lg p-5 shadow-card">
          <div class="text-muted-foreground text-[12px] uppercase tracking-wider font-medium mb-1">Messages (${days}d)</div>
          <div class="text-[28px] font-bold text-success">${overview.totalMessages.toLocaleString()}</div>
        </div>
        <div class="bg-card rounded-lg p-5 shadow-card">
          <div class="text-muted-foreground text-[12px] uppercase tracking-wider font-medium mb-1">Active Channels</div>
          <div class="text-[28px] font-bold text-discord-blurple">${activeChannelCount}</div>
        </div>
      </div>

      <!-- Charts -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <div class="bg-card rounded-lg p-5 shadow-card">
          <h3 class="text-[14px] font-semibold mb-4">Member Count</h3>
          <div style="height: 250px;">
            <canvas ref=${memberChartRef}></canvas>
          </div>
        </div>
        <div class="bg-card rounded-lg p-5 shadow-card">
          <h3 class="text-[14px] font-semibold mb-4">Daily Messages</h3>
          <div style="height: 250px;">
            <canvas ref=${messageChartRef}></canvas>
          </div>
        </div>
      </div>

      <div class="bg-card rounded-lg p-5 shadow-card">
        <h3 class="text-[14px] font-semibold mb-4">Top Channels</h3>
        <div style="height: ${Math.max(200, channelData.length * 35)}px;">
          <canvas ref=${channelChartRef}></canvas>
        </div>
      </div>
    `}

    ${!loading && !overview && guildId && html`
      <div class="bg-card rounded-lg p-5 shadow-card">
        <p class="text-muted-foreground text-sm">No stats data available yet. Data will be collected automatically.</p>
      </div>
    `}
  `;
}
