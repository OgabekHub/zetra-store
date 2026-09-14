// @vitest-environment node
import { describe, expect, it } from 'vitest';

// Testlarda PBKDF2 iteratsiyalari kamaytiriladi, aks holda har bir xesh
// sekundlab vaqt oladi.
const FAST = { iterations: 1_000 };

async function load() {
  const accounts = await import('./accountsStore');
  const auth = await import('./authStore');
  const security = await import('./securityStore');
  return { ...accounts, ...auth, ...security };
}

describe('ro\'yxatdan o\'tish', () => {
  it('parolni faqat xesh sifatida saqlaydi', async () => {
    const { registerAccount, accountsStore } = await load();
    const result = await registerAccount('Ali', 'ali@mail.uz', 'Kuchli-parol-1', FAST);

    expect(result.ok).toBe(true);
    const stored = JSON.stringify(accountsStore.getSnapshot());
    expect(stored).not.toContain('Kuchli-parol-1');
    expect(result.ok && result.account.password?.algorithm).toBe('PBKDF2-SHA256');
  });

  it('band email bilan qayta ro\'yxatdan o\'tishni rad etadi', async () => {
    const { registerAccount } = await load();
    await registerAccount('Ali', 'ali@mail.uz', 'Kuchli-parol-1', FAST);
    expect(await registerAccount('Boshqa', 'ALI@mail.uz', 'Boshqa-parol-2', FAST)).toEqual({
      ok: false,
      reason: 'email-taken',
    });
  });

  it('ijtimoiy kirish orqali yaratilgan hisobga parol biriktiradi va id ni saqlaydi', async () => {
    const { login, registerAccount } = await load();
    const social = login('Demo', 'demo@mail.uz');
    const result = await registerAccount('Demo', 'demo@mail.uz', 'Yangi-parol-1', FAST);
    expect(result.ok && result.account.id).toBe(social.id);
  });
});

describe('verifyCredentials', () => {
  // Regressiya: avval parol umuman tekshirilmasdi.
  it('faqat to\'g\'ri parol bilan o\'tadi', async () => {
    const { registerAccount, verifyCredentials } = await load();
    await registerAccount('Ali', 'ali@mail.uz', 'Kuchli-parol-1', FAST);

    const ok = await verifyCredentials('ALI@mail.uz', 'Kuchli-parol-1', FAST);
    expect(ok.ok && ok.account.email).toBe('ali@mail.uz');
    expect(await verifyCredentials('ali@mail.uz', 'noto\'g\'ri-parol', FAST)).toEqual({ ok: false, reason: 'invalid' });
  });

  it('noma\'lum va parolsiz hisob uchun ham bir xil javob beradi', async () => {
    const { login, verifyCredentials } = await load();
    login('Demo', 'demo@mail.uz');
    const unknown = await verifyCredentials('hech-kim@mail.uz', 'parol-12345', FAST);
    const passwordless = await verifyCredentials('demo@mail.uz', 'parol-12345', FAST);
    expect(unknown).toEqual({ ok: false, reason: 'invalid' });
    expect(passwordless).toEqual(unknown);
  });

  it('kuchsizroq xeshni kirish paytida yangilaydi', async () => {
    const { registerAccount, verifyCredentials, findAccountByEmail } = await load();
    await registerAccount('Ali', 'ali@mail.uz', 'Kuchli-parol-1', FAST);
    await verifyCredentials('ali@mail.uz', 'Kuchli-parol-1', { iterations: 2_000 });
    expect(findAccountByEmail('ali@mail.uz')?.password?.iterations).toBe(2_000);
    expect((await verifyCredentials('ali@mail.uz', 'Kuchli-parol-1', { iterations: 2_000 })).ok).toBe(true);
  });
});

describe('changePassword', () => {
  it('joriy parolni talab qiladi', async () => {
    const { registerAccount, changePassword, verifyCredentials } = await load();
    const registered = await registerAccount('Ali', 'ali@mail.uz', 'Eski-parol-1', FAST);
    if (!registered.ok) throw new Error('ro\'yxatdan o\'tmadi');
    const { id } = registered.account;

    expect(await changePassword(id, 'xato-joriy', 'Yangi-parol-2', FAST)).toEqual({
      ok: false,
      reason: 'invalid-current',
    });
    expect(await changePassword(id, 'Eski-parol-1', 'Yangi-parol-2', FAST)).toEqual({ ok: true });
    expect((await verifyCredentials('ali@mail.uz', 'Eski-parol-1', FAST)).ok).toBe(false);
    expect((await verifyCredentials('ali@mail.uz', 'Yangi-parol-2', FAST)).ok).toBe(true);
  });

  it('parolsiz hisobga joriy parolsiz parol o\'rnatadi, noma\'lum hisobni rad etadi', async () => {
    const { login, changePassword, verifyCredentials } = await load();
    const social = login('Demo', 'demo@mail.uz');
    expect(await changePassword(social.id, '', 'Birinchi-parol-1', FAST)).toEqual({ ok: true });
    expect((await verifyCredentials('demo@mail.uz', 'Birinchi-parol-1', FAST)).ok).toBe(true);
    expect(await changePassword('mavjud-emas', '', 'x-parol-12345', FAST)).toEqual({
      ok: false,
      reason: 'not-found',
    });
  });
});

describe('profilni yangilash', () => {
  // Regressiya: avval `rekeyAccount` yangi obyektni noldan qurib, parolni
  // yo'qotardi.
  it('email o\'zgarganda parol saqlanadi', async () => {
    const { registerAccount, login, updateProfile, verifyCredentials } = await load();
    await registerAccount('Ali', 'ali@mail.uz', 'Kuchli-parol-1', FAST);
    login('Ali', 'ali@mail.uz');

    expect(updateProfile('Ali', 'ali.yangi@mail.uz').ok).toBe(true);
    expect((await verifyCredentials('ali.yangi@mail.uz', 'Kuchli-parol-1', FAST)).ok).toBe(true);
  });

  // Regressiya: boshqa hisobning email'i tanlansa, o'sha hisob jimgina
  // ustidan yozilib o'chib ketardi.
  it('boshqa hisobga tegishli emailni rad etadi va ikkala hisobni saqlaydi', async () => {
    const { registerAccount, login, updateProfile, findAccountByEmail } = await load();
    const bob = await registerAccount('Bob', 'bob@mail.uz', 'Bob-parol-123', FAST);
    await registerAccount('Ali', 'ali@mail.uz', 'Ali-parol-123', FAST);
    login('Ali', 'ali@mail.uz');

    expect(updateProfile('Ali', 'BOB@mail.uz')).toEqual({ ok: false, reason: 'email-taken' });
    expect(findAccountByEmail('bob@mail.uz')?.id).toBe(bob.ok && bob.account.id);
    expect(findAccountByEmail('ali@mail.uz')).toBeDefined();
  });

  it('email o\'zgarganda seans va jurnal yozuvlari ham ko\'chiriladi', async () => {
    const { login, updateProfile, createSession, logSecurityEvent, sessionsStore, securityLogsStore } = await load();
    login('Ali', 'ali@mail.uz');
    createSession('ali@mail.uz');
    logSecurityEvent('ali@mail.uz', 'kirish');

    updateProfile('Ali', 'ali.yangi@mail.uz');

    expect(sessionsStore.getSnapshot().map((s) => s.email)).toEqual(['ali.yangi@mail.uz']);
    expect(securityLogsStore.getSnapshot().map((l) => l.email)).toEqual(['ali.yangi@mail.uz']);
  });
});
