/**
 * Проверяет, что URL не указывает на приватные/локальные адреса.
 * Защита от атак типа SSRF (Server-Side Request Forgery).
 * Бросает createError(400) если адрес запрещён.
 */
export function assertNotPrivateUrl(url: string): void {
  const hostname = new URL(url).hostname.toLowerCase();

  // Проверяем все RFC 1918 приватные диапазоны и loopback адреса
  const isPrivate =
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1' ||
    hostname.startsWith('192.168.') ||
    hostname.startsWith('10.') ||
    // Диапазон 172.16.0.0 – 172.31.255.255 (RFC 1918)
    /^172\.(1[6-9]|2\d|3[01])\./.test(hostname);

  if (isPrivate) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Использование локальных адресов запрещено',
    });
  }
}
