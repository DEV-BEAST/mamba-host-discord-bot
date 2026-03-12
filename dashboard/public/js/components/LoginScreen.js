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
    <div class="flex items-center justify-center h-screen bg-background">
      <div class="bg-card border border-accent/20 rounded-lg p-10 w-[400px] text-center shadow-login">
        <div class="flex items-center justify-center gap-3 font-brand text-[26px] font-bold text-foreground mb-2 tracking-wider whitespace-nowrap">
          <img src="https://www.mambahost.com/og/logo-trans.png" alt="" class="w-12 h-12 object-contain" />
          <span>Mamba Host</span>
        </div>
        <p class="text-muted-foreground mb-8 text-sm">Bot Dashboard</p>
        <form onSubmit=${handleSubmit} class="flex flex-col gap-4">
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
            size="medium"
            loading=${loading}
            class="w-full"
          >Login</sl-button>
          ${error && html`
            <div class="text-left text-sm py-2 px-3 rounded-sm bg-[rgba(242,63,67,0.12)] text-destructive">
              ${error}
            </div>
          `}
        </form>
      </div>
    </div>
  `;
}
