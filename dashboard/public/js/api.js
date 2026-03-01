/**
 * Fetch wrapper with auth handling
 */

export async function api(path, options = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });

  if (res.status === 401) {
    // Session expired — reload to show login
    window.location.reload();
    throw new Error('Unauthorized');
  }

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }

  return data;
}

export function get(path) {
  return api(path);
}

export function post(path, body) {
  return api(path, { method: 'POST', body: JSON.stringify(body) });
}

export function put(path, body) {
  return api(path, { method: 'PUT', body: JSON.stringify(body) });
}
