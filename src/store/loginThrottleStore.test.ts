import { describe, expect, it } from 'vitest';

const NOW = 1_700_000_000_000;

async function load() {
  return import('./loginThrottleStore');
}

describe('evaluateThrottle va applyFailure', () => {
  it('chegaragacha ruxsat beradi, keyin bloklaydi', async () => {
    const { applyFailure, evaluateThrottle, MAX_FAILED_ATTEMPTS, LOCKOUT_MS } = await load();
    let entry = undefined as ReturnType<typeof applyFailure> | undefined;
    for (let i = 1; i < MAX_FAILED_ATTEMPTS; i++) {
      entry = applyFailure(entry, NOW);
      expect(evaluateThrottle(entry, NOW)).toEqual({ allowed: true });
    }
    entry = applyFailure(entry, NOW);
    expect(evaluateThrottle(entry, NOW)).toEqual({ allowed: false, retryAfterMs: LOCKOUT_MS });
    expect(evaluateThrottle(entry, NOW + LOCKOUT_MS)).toEqual({ allowed: true });
  });

  it('blok tugagach hisoblagich noldan boshlanadi', async () => {
    const { applyFailure, MAX_FAILED_ATTEMPTS, LOCKOUT_MS } = await load();
    let entry = undefined as ReturnType<typeof applyFailure> | undefined;
    for (let i = 0; i < MAX_FAILED_ATTEMPTS; i++) entry = applyFailure(entry, NOW);
    const after = applyFailure(entry, NOW + LOCKOUT_MS + 1);
    expect(after).toEqual({ failures: 1, firstFailureAt: NOW + LOCKOUT_MS + 1, lockedUntil: null });
  });

  it('eski urinishlar oynadan tashqarida hisoblanmaydi', async () => {
    const { applyFailure, FAILURE_WINDOW_MS } = await load();
    const entry = applyFailure(applyFailure(undefined, NOW), NOW);
    expect(applyFailure(entry, NOW + FAILURE_WINDOW_MS + 1).failures).toBe(1);
  });
});

describe('loginThrottleStore', () => {
  it('muvaffaqiyatsiz urinishlarni email bo\'yicha (katta-kichik harfsiz) hisoblaydi', async () => {
    const { recordLoginFailure, getLoginStatus, MAX_FAILED_ATTEMPTS } = await load();
    let outcome = recordLoginFailure('Ali@Mail.uz', NOW);
    for (let i = 1; i < MAX_FAILED_ATTEMPTS; i++) outcome = recordLoginFailure('ali@mail.uz', NOW);

    expect(outcome.locked).toBe(true);
    expect(outcome.retryAfterMs).toBeGreaterThan(0);
    expect(getLoginStatus('ALI@mail.uz', NOW).allowed).toBe(false);
    expect(getLoginStatus('boshqa@mail.uz', NOW).allowed).toBe(true);
  });

  it('muvaffaqiyatli kirish hisoblagichni tozalaydi', async () => {
    const { recordLoginFailure, recordLoginSuccess, loginThrottleStore } = await load();
    recordLoginFailure('ali@mail.uz', NOW);
    recordLoginSuccess('ali@mail.uz');
    expect(loginThrottleStore.getSnapshot()).toEqual({});

    const snapshot = loginThrottleStore.getSnapshot();
    recordLoginSuccess('hech-kim@mail.uz');
    expect(loginThrottleStore.getSnapshot()).toBe(snapshot);
  });

  it('eskirgan yozuvlar yangi urinishda tozalanadi', async () => {
    const { recordLoginFailure, loginThrottleStore, FAILURE_WINDOW_MS } = await load();
    recordLoginFailure('eski@mail.uz', NOW);
    recordLoginFailure('yangi@mail.uz', NOW + FAILURE_WINDOW_MS + 1);
    expect(Object.keys(loginThrottleStore.getSnapshot())).toEqual(['yangi@mail.uz']);
  });

  it('buzilgan saqlangan yozuvlarni tashlaydi', async () => {
    localStorage.setItem(
      'zetra-auth-throttle',
      JSON.stringify({
        v: 1,
        data: {
          'ok@mail.uz': { failures: 2, firstFailureAt: NOW, lockedUntil: null },
          'bad@mail.uz': { failures: -1, firstFailureAt: NOW, lockedUntil: null },
          'bad2@mail.uz': { failures: 1, firstFailureAt: NOW, lockedUntil: 'ertaga' },
        },
      }),
    );
    const { loginThrottleStore } = await load();
    expect(Object.keys(loginThrottleStore.getSnapshot())).toEqual(['ok@mail.uz']);
  });
});
