export const AES_KEY_LENGTH = 256
export const NONCE_LENGTH = 12

export async function generateMasterKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    { name: 'AES-GCM', length: AES_KEY_LENGTH },
    true,
    ['encrypt', 'decrypt']
  )
}

export async function exportKey(key: CryptoKey): Promise<ArrayBuffer> {
  return crypto.subtle.exportKey('raw', key)
}

export async function importKey(raw: ArrayBuffer): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    raw,
    { name: 'AES-GCM', length: AES_KEY_LENGTH },
    true,
    ['encrypt', 'decrypt']
  )
}

export async function encrypt(
  plaintext: string,
  key: CryptoKey
): Promise<{ encrypted: string; nonce: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(NONCE_LENGTH))
  const encoder = new TextEncoder()
  const encoded = encoder.encode(plaintext) as unknown as BufferSource

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as unknown as BufferSource },
    key,
    encoded
  )

  return {
    encrypted: arrayBufferToBase64(encrypted),
    nonce: arrayBufferToBase64(iv.buffer),
  }
}

export async function decrypt(
  encrypted: string,
  key: CryptoKey,
  nonce: string
): Promise<string> {
  const iv = base64ToArrayBuffer(nonce) as unknown as BufferSource
  const ciphertext = base64ToArrayBuffer(encrypted) as unknown as BufferSource

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  )

  const decoder = new TextDecoder()
  return decoder.decode(decrypted)
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

export function arrayBufferToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export function hexToArrayBuffer(hex: string): ArrayBuffer {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16)
  }
  return bytes.buffer
}
