/**
 * Demo uchun qurilma va IP ma'lumoti.
 *
 * Bu kod avval `AuthModal.tsx:32-54` va `UserProfileModal.tsx:74-95` da
 * deyarli so'zma-so'z ikki marta takrorlangan edi.
 *
 * DIQQAT: bu soxta ma'lumot. Haqiqiy IP faqat serverdan olinadi.
 */
const UZ_IP_PREFIXES = ['213.230.76.', '94.158.52.', '81.95.230.', '37.110.212.'];

export function getMockIP(): string {
  const prefix = UZ_IP_PREFIXES[Math.floor(Math.random() * UZ_IP_PREFIXES.length)];
  return prefix + (Math.floor(Math.random() * 254) + 1);
}

export function getDeviceLabel(): string {
  if (typeof navigator === 'undefined') return 'Unknown Device';
  const ua = navigator.userAgent;

  let os = 'Windows';
  if (ua.includes('Macintosh')) os = 'macOS';
  if (ua.includes('Linux')) os = 'Linux';
  if (ua.includes('iPhone')) os = 'iPhone';
  if (ua.includes('iPad')) os = 'iPad';
  if (ua.includes('Android')) os = 'Android';

  let browser = 'Chrome';
  if (ua.includes('Firefox')) browser = 'Firefox';
  if (ua.includes('Edg')) browser = 'Edge';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';

  return `${browser} (${os})`;
}

export function createRecordId(prefix: string): string {
  return `${prefix}-${Math.floor(100000 + Math.random() * 900000)}`;
}
