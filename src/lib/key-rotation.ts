/**
 * Key Rotation Utility
 * 
 * This utility helps with rotating encryption keys when a key is compromised.
 * 
 * IMPORTANT: This is a complex operation that should be done carefully.
 * 
 * Usage:
 * 1. Set OLD_ENCRYPTION_KEY and NEW_ENCRYPTION_KEY environment variables
 * 2. Run this script to re-encrypt all data
 * 3. Update ENCRYPTION_KEY to the new key
 * 4. Remove OLD_ENCRYPTION_KEY
 */

import { prisma } from "@/lib/prisma";
import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const ITERATIONS = 100000;

function getKey(keyString: string | undefined, keyName: string): Buffer {
  if (!keyString) {
    throw new Error(`${keyName} environment variable is required`);
  }

  if (keyString.length === 64) {
    return Buffer.from(keyString, "hex");
  }

  return crypto.scryptSync(keyString, "encryption-salt", KEY_LENGTH);
}

function decryptWithKey(encryptedValue: string, key: Buffer): string | null {
  if (!encryptedValue || !encryptedValue.includes(":")) {
    return encryptedValue; // Already unencrypted
  }

  try {
    const parts = encryptedValue.split(":");
    if (parts.length !== 4) {
      return encryptedValue;
    }

    const [saltBase64, ivBase64, tagBase64, encrypted] = parts;
    const salt = Buffer.from(saltBase64, "base64");
    const iv = Buffer.from(ivBase64, "base64");
    const tag = Buffer.from(tagBase64, "base64");
    const derivedKey = crypto.pbkdf2Sync(key, salt, ITERATIONS, KEY_LENGTH, "sha256");
    const decipher = crypto.createDecipheriv(ALGORITHM, derivedKey, iv);
    decipher.setAuthTag(tag);
    let decrypted = decipher.update(encrypted, "base64", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (error) {
    console.error("Decryption error:", error);
    return encryptedValue;
  }
}

function encryptWithKey(value: string, key: Buffer): string {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);
  const derivedKey = crypto.pbkdf2Sync(key, salt, ITERATIONS, KEY_LENGTH, "sha256");
  const cipher = crypto.createCipheriv(ALGORITHM, derivedKey, iv);
  let encrypted = cipher.update(value, "utf8", "base64");
  encrypted += cipher.final("base64");
  const tag = cipher.getAuthTag();
  return [salt.toString("base64"), iv.toString("base64"), tag.toString("base64"), encrypted].join(":");
}

function encryptJsonWithKey(value: any, key: Buffer): string {
  return encryptWithKey(JSON.stringify(value), key);
}

function decryptJsonWithKey(encryptedValue: string, key: Buffer): any {
  const decrypted = decryptWithKey(encryptedValue, key);
  if (!decrypted) return null;
  try {
    return JSON.parse(decrypted);
  } catch {
    try {
      return JSON.parse(encryptedValue);
    } catch {
      return null;
    }
  }
}

/**
 * Rotate encryption keys for all journal entries
 * 
 * WARNING: This is a destructive operation. Make sure you have:
 * 1. A database backup
 * 2. Both OLD_ENCRYPTION_KEY and NEW_ENCRYPTION_KEY set
 * 3. Tested this in a development environment first
 */
export async function rotateJournalEntryKeys() {
  const oldKey = getKey(process.env.OLD_ENCRYPTION_KEY, "OLD_ENCRYPTION_KEY");
  const newKey = getKey(process.env.NEW_ENCRYPTION_KEY, "NEW_ENCRYPTION_KEY");

  console.log("Starting key rotation for journal entries...");

  // Get all journal entries in batches
  let skip = 0;
  const batchSize = 100;
  let totalProcessed = 0;
  let totalUpdated = 0;
  let totalErrors = 0;

  while (true) {
    const entries = await prisma.journalEntry.findMany({
      skip,
      take: batchSize,
      select: {
        id: true,
        contentJson: true,
        contentText: true,
        title: true,
      },
    });

    if (entries.length === 0) break;

    for (const entry of entries) {
      try {
        let needsUpdate = false;
        const updates: {
          contentJson?: any;
          contentText?: string;
          title?: string;
        } = {};

        // Re-encrypt contentJson
        if (entry.contentJson) {
          const decrypted = decryptJsonWithKey(entry.contentJson as string, oldKey);
          if (decrypted) {
            updates.contentJson = encryptJsonWithKey(decrypted, newKey);
            needsUpdate = true;
          }
        }

        // Re-encrypt contentText
        if (entry.contentText) {
          const decrypted = decryptWithKey(entry.contentText, oldKey);
          if (decrypted && decrypted !== entry.contentText) {
            updates.contentText = encryptWithKey(decrypted, newKey);
            needsUpdate = true;
          }
        }

        // Re-encrypt title
        if (entry.title) {
          const decrypted = decryptWithKey(entry.title, oldKey);
          if (decrypted && decrypted !== entry.title) {
            updates.title = encryptWithKey(decrypted, newKey);
            needsUpdate = true;
          }
        }

        if (needsUpdate) {
          await prisma.journalEntry.update({
            where: { id: entry.id },
            data: updates,
          });
          totalUpdated++;
        }

        totalProcessed++;
      } catch (error) {
        console.error(`Error processing entry ${entry.id}:`, error);
        totalErrors++;
      }
    }

    skip += batchSize;
    console.log(`Processed ${totalProcessed} entries, updated ${totalUpdated}, errors: ${totalErrors}`);
  }

  console.log(`\nKey rotation complete!`);
  console.log(`Total processed: ${totalProcessed}`);
  console.log(`Total updated: ${totalUpdated}`);
  console.log(`Total errors: ${totalErrors}`);
  console.log(`\n⚠️  Next steps:`);
  console.log(`1. Update ENCRYPTION_KEY to NEW_ENCRYPTION_KEY`);
  console.log(`2. Remove OLD_ENCRYPTION_KEY and NEW_ENCRYPTION_KEY`);
  console.log(`3. Restart your application`);
}
