import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { encryptSecret, decryptSecret } from "@/lib/connector-crypto.server";

describe("Connector Crypto Server Module", () => {
  const originalKey = process.env.CONNECTOR_ENCRYPTION_KEY;

  beforeEach(() => {
    process.env.CONNECTOR_ENCRYPTION_KEY = "test-secret-key-32-bytes-long-devos";
  });

  afterEach(() => {
    process.env.CONNECTOR_ENCRYPTION_KEY = originalKey;
  });

  it("encrypts and decrypts secret correctly", async () => {
    const secret = "ghp_mySuperSecretGithubToken123456789";
    const encrypted = await encryptSecret(secret);
    expect(encrypted).toContain(".");
    expect(encrypted).not.toEqual(secret);

    const decrypted = await decryptSecret(encrypted);
    expect(decrypted).toEqual(secret);
  });

  it("throws error if encryption key is not configured", async () => {
    delete process.env.CONNECTOR_ENCRYPTION_KEY;
    await expect(encryptSecret("test")).rejects.toThrow(
      "Connector encryption key is not configured.",
    );
  });

  it("throws error if payload is corrupted", async () => {
    await expect(decryptSecret("corruptedpayload")).rejects.toThrow(
      "Stored connection is corrupted.",
    );
  });
});
