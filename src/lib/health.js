async function checkProjectUrl(targetUrl, timeoutMs) {
  const started = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    let response = await fetch(targetUrl, {
      method: 'HEAD',
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'user-agent': 'AlphaClaw-StatusBoard/1.0' }
    });

    if (response.status === 405 || response.status === 501) {
      response = await fetch(targetUrl, {
        method: 'GET',
        redirect: 'follow',
        signal: controller.signal,
        headers: { 'user-agent': 'AlphaClaw-StatusBoard/1.0' }
      });
    }

    clearTimeout(timeout);
    return {
      ok: true,
      status: response.status,
      latencyMs: Date.now() - started
    };
  } catch (error) {
    clearTimeout(timeout);
    return {
      ok: false,
      status: null,
      latencyMs: Date.now() - started,
      error: error?.name === 'AbortError' ? 'timeout' : String(error?.message || error || 'error')
    };
  }
}

module.exports = { checkProjectUrl };
