import { html } from 'htm/preact';
import { useState, useEffect, useRef, useCallback } from 'preact/hooks';
import { get, post, del } from '../api.js';
import { useShoelaceEvent } from '../hooks/useShoelace.js';
import { StatusMessage } from '../components/StatusMessage.js';

const DURATION_OPTIONS = [
  { label: '1 Minute', value: 60 },
  { label: '5 Minutes', value: 300 },
  { label: '10 Minutes', value: 600 },
  { label: '1 Hour', value: 3600 },
  { label: '1 Day', value: 86400 },
  { label: '1 Week', value: 604800 },
];

const ACTION_BADGES = {
  ban: 'bg-[#da373c]/20 text-[#da373c]',
  kick: 'bg-[#e8860c]/20 text-[#e8860c]',
  timeout: 'bg-[#f0b232]/20 text-[#f0b232]',
  warn: 'bg-[#5865f2]/20 text-[#5865f2]',
};

export default function Moderation() {
  const [guilds, setGuilds] = useState([]);
  const [guildId, setGuildId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [cases, setCases] = useState([]);
  const [casePage, setCasePage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ message: '', type: 'success' });

  // Dialog state
  const [dialog, setDialog] = useState(null); // { action, member }
  const [dialogReason, setDialogReason] = useState('');
  const [dialogDuration, setDialogDuration] = useState(3600);
  const [dialogDeleteMsgs, setDialogDeleteMsgs] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Unban dialog
  const [unbanDialog, setUnbanDialog] = useState(false);
  const [unbanUserId, setUnbanUserId] = useState('');

  const guildRef = useRef(null);
  const searchRef = useRef(null);
  const dialogRef = useRef(null);
  const unbanDialogRef = useRef(null);
  const durationRef = useRef(null);
  const deleteConfirmRef = useRef(null);
  const [deleteCaseId, setDeleteCaseId] = useState(null);

  useShoelaceEvent(guildRef, 'sl-change', useCallback((e) => {
    setGuildId(e.target.value);
    setSelectedMember(null);
    setMembers([]);
    setSearchQuery('');
  }, []));

  useShoelaceEvent(searchRef, 'sl-input', useCallback((e) => {
    setSearchQuery(e.target.value);
  }, []));

  useShoelaceEvent(durationRef, 'sl-change', useCallback((e) => {
    setDialogDuration(Number(e.target.value));
  }, []));

  // Load guilds
  useEffect(() => {
    get('/api/guilds')
      .then(g => { setGuilds(g); if (g.length > 0) setGuildId(g[0].id); })
      .catch(() => {});
  }, []);

  // Search members
  useEffect(() => {
    if (!guildId || !searchQuery || searchQuery.length < 2) { setMembers([]); return; }
    const timer = setTimeout(() => {
      get(`/api/guilds/${guildId}/members?search=${encodeURIComponent(searchQuery)}`)
        .then(setMembers)
        .catch(() => setMembers([]));
    }, 300);
    return () => clearTimeout(timer);
  }, [guildId, searchQuery]);

  // Load cases
  useEffect(() => {
    if (!guildId) return;
    loadCases();
  }, [guildId, casePage]);

  function loadCases() {
    get(`/api/moderation/${guildId}/cases?page=${casePage}`)
      .then(data => { setCases(data.cases); setTotalPages(data.totalPages); })
      .catch(() => setCases([]));
  }

  function openAction(action, member) {
    setDialog({ action, member });
    setDialogReason('');
    setDialogDuration(3600);
    setDialogDeleteMsgs(false);
    setTimeout(() => dialogRef.current?.show(), 0);
  }

  async function executeAction() {
    if (!dialog) return;
    setSubmitting(true);
    const { action, member } = dialog;

    const body = { userId: member.id, reason: dialogReason };
    if (action === 'ban') body.deleteMessages = dialogDeleteMsgs;
    if (action === 'timeout') body.duration = dialogDuration;

    try {
      await post(`/api/moderation/${guildId}/${action}`, body);
      setStatus({ message: `${action.charAt(0).toUpperCase() + action.slice(1)} applied to ${member.displayName}`, type: 'success' });
      dialogRef.current?.hide();
      setDialog(null);
      loadCases();
    } catch (err) {
      setStatus({ message: err.message, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  }

  async function executeUnban() {
    if (!unbanUserId.trim()) return;
    setSubmitting(true);
    try {
      await post(`/api/moderation/${guildId}/unban`, { userId: unbanUserId.trim() });
      setStatus({ message: 'User unbanned successfully', type: 'success' });
      unbanDialogRef.current?.hide();
      setUnbanDialog(false);
      setUnbanUserId('');
    } catch (err) {
      setStatus({ message: err.message, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmDeleteCase() {
    if (!deleteCaseId) return;
    try {
      await del(`/api/moderation/cases/${deleteCaseId}`);
      setStatus({ message: 'Case deleted', type: 'success' });
      deleteConfirmRef.current?.hide();
      setDeleteCaseId(null);
      loadCases();
    } catch (err) {
      setStatus({ message: err.message, type: 'error' });
    }
  }

  const actionLabel = dialog?.action ? dialog.action.charAt(0).toUpperCase() + dialog.action.slice(1) : '';

  return html`
    <div class="mb-6">
      <h1 class="text-[22px] font-bold">Moderation</h1>
      <p class="text-muted-foreground text-sm mt-0.5">Manage members and view moderation history</p>
    </div>

    <${StatusMessage} message=${status.message} type=${status.type} onClear=${() => setStatus({ message: '', type: 'success' })} />

    <!-- Member Actions -->
    <div class="bg-card rounded-lg p-5 shadow-card mb-5">
      <h2 class="text-[16px] font-semibold mb-4">Member Actions</h2>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label class="block mb-1.5 text-[13px] font-medium text-text-secondary">Select Guild</label>
          <sl-select ref=${guildRef} value=${guildId} placeholder="Select a server..." size="medium" hoist>
            ${guilds.map(g => html`<sl-option value=${g.id}>${g.name}</sl-option>`)}
          </sl-select>
        </div>
        <div>
          <label class="block mb-1.5 text-[13px] font-medium text-text-secondary">Search Member</label>
          <sl-input ref=${searchRef} placeholder="Type a username..." size="medium" clearable></sl-input>
        </div>
      </div>

      <!-- Search Results -->
      ${members.length > 0 && !selectedMember && html`
        <div class="border border-border rounded-md max-h-[200px] overflow-y-auto mb-4">
          ${members.map(m => html`
            <button
              class="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-muted transition-colors text-left border-b border-border/40 last:border-0"
              onClick=${() => { setSelectedMember(m); setMembers([]); }}
            >
              <img class="w-7 h-7 rounded-full" src=${m.avatar} alt="" />
              <span class="font-medium">${m.displayName}</span>
              <span class="text-muted-foreground text-xs">@${m.username}</span>
            </button>
          `)}
        </div>
      `}

      <!-- Selected Member -->
      ${selectedMember && html`
        <div class="border border-border rounded-md p-4 mb-4">
          <div class="flex items-center justify-between flex-wrap gap-3">
            <div class="flex items-center gap-3">
              <img class="w-10 h-10 rounded-full" src=${selectedMember.avatar} alt="" />
              <div>
                <div class="font-semibold">${selectedMember.displayName}</div>
                <div class="text-muted-foreground text-xs">@${selectedMember.username}</div>
              </div>
            </div>
            <div class="flex items-center gap-2 flex-wrap">
              <sl-button size="small" variant="danger" onClick=${() => openAction('ban', selectedMember)}>Ban</sl-button>
              <sl-button size="small" variant="warning" onClick=${() => openAction('kick', selectedMember)}>Kick</sl-button>
              <sl-button size="small" variant="neutral" onClick=${() => openAction('timeout', selectedMember)}>Timeout</sl-button>
              <sl-button size="small" variant="primary" onClick=${() => openAction('warn', selectedMember)}>Warn</sl-button>
              <sl-button size="small" variant="text" onClick=${() => setSelectedMember(null)}>Clear</sl-button>
            </div>
          </div>
        </div>
      `}

      <!-- Unban Button -->
      ${guildId && html`
        <sl-button size="small" variant="default" onClick=${() => { setUnbanDialog(true); setTimeout(() => unbanDialogRef.current?.show(), 0); }}>
          Unban User by ID
        </sl-button>
      `}
    </div>

    <!-- Moderation Log -->
    <div class="bg-card rounded-lg p-5 shadow-card">
      <h2 class="text-[16px] font-semibold mb-4">Moderation Log</h2>

      ${cases.length === 0 && html`
        <p class="text-muted-foreground text-sm py-4">No moderation cases yet.</p>
      `}

      ${cases.length > 0 && html`
        <div class="overflow-x-auto">
          <table class="w-full border-collapse">
            <thead>
              <tr>
                <th class="text-left px-3 py-2.5 text-[12px] text-muted-foreground uppercase tracking-wider border-b border-border font-medium">Case</th>
                <th class="text-left px-3 py-2.5 text-[12px] text-muted-foreground uppercase tracking-wider border-b border-border font-medium">User</th>
                <th class="text-left px-3 py-2.5 text-[12px] text-muted-foreground uppercase tracking-wider border-b border-border font-medium">Action</th>
                <th class="text-left px-3 py-2.5 text-[12px] text-muted-foreground uppercase tracking-wider border-b border-border font-medium">Reason</th>
                <th class="text-left px-3 py-2.5 text-[12px] text-muted-foreground uppercase tracking-wider border-b border-border font-medium">Moderator</th>
                <th class="text-left px-3 py-2.5 text-[12px] text-muted-foreground uppercase tracking-wider border-b border-border font-medium">Date</th>
                <th class="text-left px-3 py-2.5 text-[12px] text-muted-foreground uppercase tracking-wider border-b border-border font-medium w-[60px]"></th>
              </tr>
            </thead>
            <tbody>
              ${cases.map(c => html`
                <tr class="hover:bg-muted transition-colors duration-100">
                  <td class="px-3 py-2.5 border-b border-border/60 text-sm font-bold">#${c.id}</td>
                  <td class="px-3 py-2.5 border-b border-border/60 text-sm">${c.username}</td>
                  <td class="px-3 py-2.5 border-b border-border/60 text-sm">
                    <span class="inline-block px-2 py-0.5 rounded text-xs font-semibold uppercase ${ACTION_BADGES[c.action]}">
                      ${c.action}
                    </span>
                  </td>
                  <td class="px-3 py-2.5 border-b border-border/60 text-sm max-w-[200px] truncate">${c.reason || '—'}</td>
                  <td class="px-3 py-2.5 border-b border-border/60 text-sm">${c.moderatorName}</td>
                  <td class="px-3 py-2.5 border-b border-border/60 text-sm text-muted-foreground">${new Date(c.created_at).toLocaleString()}</td>
                  <td class="px-3 py-2.5 border-b border-border/60 text-sm">
                    <sl-icon-button
                      name="trash"
                      label="Delete"
                      class="text-muted-foreground hover:text-destructive"
                      onClick=${() => { setDeleteCaseId(c.id); setTimeout(() => deleteConfirmRef.current?.show(), 0); }}
                    ></sl-icon-button>
                  </td>
                </tr>
              `)}
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        ${totalPages > 1 && html`
          <div class="flex items-center justify-center gap-2 mt-4">
            <sl-button size="small" variant="default" ?disabled=${casePage <= 1} onClick=${() => setCasePage(p => p - 1)}>Previous</sl-button>
            <span class="text-sm text-muted-foreground">Page ${casePage} of ${totalPages}</span>
            <sl-button size="small" variant="default" ?disabled=${casePage >= totalPages} onClick=${() => setCasePage(p => p + 1)}>Next</sl-button>
          </div>
        `}
      `}
    </div>

    <!-- Action Dialog -->
    <sl-dialog ref=${dialogRef} label="${actionLabel} Member" class="mod-dialog">
      ${dialog && html`
        <p class="text-sm mb-3">
          ${dialog.action === 'ban' && 'Ban'}
          ${dialog.action === 'kick' && 'Kick'}
          ${dialog.action === 'timeout' && 'Timeout'}
          ${dialog.action === 'warn' && 'Warn'}
          ${' '}<strong>${dialog.member.displayName}</strong>?
        </p>
        <sl-textarea
          label="Reason"
          placeholder="Enter a reason..."
          value=${dialogReason}
          onsl-input=${(e) => setDialogReason(e.target.value)}
        ></sl-textarea>

        ${dialog.action === 'timeout' && html`
          <div class="mt-3">
            <sl-select ref=${durationRef} label="Duration" value=${String(dialogDuration)} hoist>
              ${DURATION_OPTIONS.map(d => html`<sl-option value=${String(d.value)}>${d.label}</sl-option>`)}
            </sl-select>
          </div>
        `}

        ${dialog.action === 'ban' && html`
          <div class="mt-3">
            <sl-checkbox ?checked=${dialogDeleteMsgs} onsl-change=${(e) => setDialogDeleteMsgs(e.target.checked)}>
              Delete messages from last 7 days
            </sl-checkbox>
          </div>
        `}

        <div class="mt-4 flex justify-end gap-2" slot="footer">
          <sl-button variant="default" onClick=${() => dialogRef.current?.hide()}>Cancel</sl-button>
          <sl-button variant=${dialog.action === 'ban' ? 'danger' : 'primary'} ?loading=${submitting} onClick=${executeAction}>
            Confirm ${actionLabel}
          </sl-button>
        </div>
      `}
    </sl-dialog>

    <!-- Unban Dialog -->
    <sl-dialog ref=${unbanDialogRef} label="Unban User">
      <sl-input
        label="User ID"
        placeholder="Enter user ID to unban..."
        value=${unbanUserId}
        onsl-input=${(e) => setUnbanUserId(e.target.value)}
      ></sl-input>
      <div class="mt-4 flex justify-end gap-2" slot="footer">
        <sl-button variant="default" onClick=${() => unbanDialogRef.current?.hide()}>Cancel</sl-button>
        <sl-button variant="primary" ?loading=${submitting} onClick=${executeUnban}>Unban</sl-button>
      </div>
    </sl-dialog>

    <!-- Delete Confirmation Dialog -->
    <sl-dialog ref=${deleteConfirmRef} label="Delete Case">
      <p class="text-sm">Are you sure you want to delete case #${deleteCaseId}? This cannot be undone.</p>
      <div class="mt-4 flex justify-end gap-2" slot="footer">
        <sl-button variant="default" onClick=${() => deleteConfirmRef.current?.hide()}>Cancel</sl-button>
        <sl-button variant="danger" onClick=${confirmDeleteCase}>Delete</sl-button>
      </div>
    </sl-dialog>
  `;
}
