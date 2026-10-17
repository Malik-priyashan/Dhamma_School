import test from 'node:test';
import assert from 'node:assert/strict';

test('renews an active session before access expiry and retries an unauthorized request', async () => {
  const original = {
    fetch: globalThis.fetch,
    localStorage: globalThis.localStorage,
    navigator: globalThis.navigator,
    now: Date.now,
  };
  const values = new Map();
  let now = 1_000_000;
  let refreshCount = 0;
  let protectedCount = 0;
  let lockQueue = Promise.resolve();

  try {
    Date.now = () => now;
    globalThis.localStorage = {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
      removeItem: (key) => values.delete(key),
    };
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: { locks: { request: (_name, callback) => {
        const request = lockQueue.then(() => callback({}));
        lockQueue = request.then(() => undefined, () => undefined);
        return request;
      } } },
    });
    globalThis.fetch = async (url, init) => {
      if (url.endsWith('/login')) return Response.json({ user: { id: '1' } });
      if (url.endsWith('/refresh')) {
        assert.equal(init.credentials, 'include');
        refreshCount += 1;
        return Response.json({ message: 'Token refreshed successfully' });
      }
      if (url === '/protected') {
        protectedCount += 1;
        return new Response(null, { status: protectedCount === 1 ? 401 : 200 });
      }
      throw new Error(`Unexpected request: ${url}`);
    };

    const auth = await import('../src/app/features/auth/api/authApi.ts');
    const otherTab = await import('../src/app/features/auth/api/authApi.ts?other-tab');
    await auth.loginUser({ email: 'user@example.com', password: 'test' });
    assert.equal(auth.sessionNeedsRenewal(), false);

    now += 10 * 60 * 1000;
    assert.equal(auth.sessionNeedsRenewal(), true);
    assert.deepEqual(await Promise.all([
      auth.renewSessionIfNeeded(),
      auth.renewSessionIfNeeded(),
      otherTab.renewSessionIfNeeded(),
    ]), [true, true, true]);
    assert.equal(refreshCount, 1);
    assert.equal(auth.sessionNeedsRenewal(), false);

    assert.equal((await auth.fetchWithAuth('/protected')).status, 200);
    assert.equal(protectedCount, 2);
    assert.equal(refreshCount, 2);
  } finally {
    Date.now = original.now;
    globalThis.fetch = original.fetch;
    globalThis.localStorage = original.localStorage;
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: original.navigator,
    });
  }
});
