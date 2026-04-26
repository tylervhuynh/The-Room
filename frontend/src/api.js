export async function api(path, payload = {}) {
  let response;

  try {
    response = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    throw new Error(
      'The frontend could not reach the local API. Start the backend with `node server.js` and keep it running while using the React app.'
    );
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error || `Request failed (${response.status})`);
  return data;
}
