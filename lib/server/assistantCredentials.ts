import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { db, app_settings } from "@/lib/db";
import { eq } from "drizzle-orm";

export const GROQ_SETTINGS_KEY = "groq_api_key";

type EncryptedSecret = {
  version: 1;
  iv: string;
  tag: string;
  ciphertext: string;
};

function encryptionKey(): Buffer {
  const value = process.env.SETTINGS_ENCRYPTION_KEY || "";
  if (!/^[a-f\d]{64}$/i.test(value)) {
    throw new Error("SETTINGS_ENCRYPTION_KEY must be a 64-character hex key");
  }
  return Buffer.from(value, "hex");
}

export function canEncryptSettings(): boolean {
  return /^[a-f\d]{64}$/i.test(process.env.SETTINGS_ENCRYPTION_KEY || "");
}

export function encryptSecret(secret: string): EncryptedSecret {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  return {
    version: 1,
    iv: iv.toString("base64"),
    tag: cipher.getAuthTag().toString("base64"),
    ciphertext: ciphertext.toString("base64"),
  };
}

export function decryptSecret(value: unknown): string {
  if (!value || typeof value !== "object") throw new Error("Invalid encrypted secret");
  const secret = value as Record<string, unknown>;
  if (secret.version !== 1 || typeof secret.iv !== "string" ||
      typeof secret.tag !== "string" || typeof secret.ciphertext !== "string") {
    throw new Error("Invalid encrypted secret");
  }
  const iv = Buffer.from(secret.iv, "base64");
  const tag = Buffer.from(secret.tag, "base64");
  if (iv.length !== 12 || tag.length !== 16) throw new Error("Invalid encrypted secret");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([
    decipher.update(Buffer.from(secret.ciphertext, "base64")),
    decipher.final(),
  ]).toString("utf8");
}

export async function getAssistantCredential(): Promise<{ key: string; source: "settings" | "environment" | "none" }> {
  const rows = await db.select({ value: app_settings.value })
    .from(app_settings).where(eq(app_settings.key, GROQ_SETTINGS_KEY)).limit(1);
  if (rows.length) return { key: decryptSecret(rows[0].value), source: "settings" };
  const key = process.env.GROQ_API_KEY?.trim() || "";
  return { key, source: key ? "environment" : "none" };
}

export async function getAssistantCredentialStatus(): Promise<{ configured: boolean; source: "settings" | "environment" | "none"; canSave: boolean }> {
  const rows = await db.select({ key: app_settings.key })
    .from(app_settings).where(eq(app_settings.key, GROQ_SETTINGS_KEY)).limit(1);
  const source = rows.length ? "settings" : process.env.GROQ_API_KEY?.trim() ? "environment" : "none";
  return { configured: source !== "none", source, canSave: canEncryptSettings() };
}
