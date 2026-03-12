import { html } from 'htm/preact';
import { useState, useRef, useCallback } from 'preact/hooks';
import { post } from '../api.js';
import { useShoelaceEvent } from '../hooks/useShoelace.js';

export function LoginScreen({ onLogin }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useShoelaceEvent(inputRef, 'sl-input', useCallback((e) => {
    setPassword(e.target.value);
  }, []));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await post('/api/auth/login', { password });
      onLogin();
    } catch (err) {
      setError(err.message || 'Invalid password');
    } finally {
      setLoading(false);
    }
  };

  return html`
    <div class="flex items-center justify-center h-screen">
      <div class="bg-card rounded-lg p-10 w-[380px] text-center">
        <div class="flex items-center justify-center gap-3 font-brand text-[25px] font-bold text-foreground mb-1 tracking-wider whitespace-nowrap">
          <img src="https://www.mambahost.com/og/logo-trans.png" alt="" class="w-12 h-12 object-contain" />
          <span>Mamba Host</span>
        </div>
        <p class="text-muted-foreground mb-6 text-sm">Bot Dashboard</p>
        <form onSubmit=${handleSubmit} class="flex flex-col gap-3">
          <sl-input
            ref=${inputRef}
            type="password"
            placeholder="Enter password"
            autocomplete="current-password"
            required
            size="medium"
          ></sl-input>
          <sl-button
            type="submit"
            variant="primary"
            loading=${loading}
            class="w-full"
          >Login</sl-button>
          ${error && html`
            <sl-alert variant="danger" open>
              <span>${error}</span>
            </sl-alert>
          `}
        </form>
      </div>
    </div>
  `;
}
