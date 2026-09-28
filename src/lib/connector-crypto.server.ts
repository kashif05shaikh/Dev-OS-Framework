/**
 * Symmetric encryption for third-party connector session data.
 * Ciphertext is stored in the database; the key only exists server-side.
 */
const encoder = new TextEncoder();
const decoder = new TextDecoder();

async function keyFor(): Promise<CryptoKey> {
  const secret = process.env["CONNECTOR_ENCRYPTION_KEY"];
  if (!secret) throw new Error("Connector encryption key is not configured.");
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(secret));
  return crypto.subtle.importKey("raw", digest, { name: "AES-GCM" }, false, [
    "encrypt",
    "decrypt",
  ]);
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value);
  const out = new Uint8Array(new ArrayBuffer(binary.length));
  for (let i = 0; i < binary.length; i += 1) out[i] = binary.charCodeAt(i);
  return out;
}

export async function encryptSecret(plaintext: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    await keyFor(),
    encoder.encode(plaintext),
  );
  return `${toBase64(iv)}.${toBase64(new Uint8Array(cipher))}`;
}

export async function decryptSecret(payload: string): Promise<string> {
  const [ivPart, cipherPart] = payload.split(".");
  if (!ivPart || !cipherPart) throw new Error("Stored connection is corrupted.");
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromBase64(ivPart) },
    await keyFor(),
    fromBase64(cipherPart),
  );
  return decoder.decode(plain);
}