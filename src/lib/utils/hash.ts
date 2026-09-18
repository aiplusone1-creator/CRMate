/**
 * Password hashing utility using SHA-256 via Web Crypto API (crypto.subtle)
 * with graceful Node.js crypto fallback for SSR/testing environments.
 */

export async function hashPassword(password: string): Promise<string> {
  const normalized = password.trim();

  // Browser Web Crypto API
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(normalized);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Node.js or SSR environment
  try {
    // Dynamic import/require for Node.js environment
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const nodeCrypto = require('crypto');
    return nodeCrypto.createHash('sha256').update(normalized).digest('hex');
  } catch (err) {
    // Standard global crypto fallback if available
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const encoder = new TextEncoder();
      const data = encoder.encode(normalized);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
    throw new Error('No cryptographic hashing provider available in current environment.');
  }
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const computed = await hashPassword(password);
  return computed.toLowerCase() === hash.toLowerCase();
}
