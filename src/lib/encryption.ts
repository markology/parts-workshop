import crypto from "crypto";

/**
 * Encryption utility for sensitive user data
 * Uses AES-256-GCM for authenticated encryption
 */

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16; // 128 bits
const SALT_LENGTH = 64; // 512 bits
const TAG_LENGTH = 16; // 128 bits
const KEY_LENGTH = 32; // 256 bits
const ITERATIONS = 100000; // PBKDF2 iterations

/**
 * Get encryption key from environment variable
 * Falls back to a default key if not set (for development only)
 * In production, this MUST be set via environment variable
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  
  if (!key) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "ENCRYPTION_KEY environment variable is required in production"
      );
    }
    // Development fallback - warn but allow
    console.warn(
      "⚠️  WARNING: ENCRYPTION_KEY not set. Using default key (NOT SECURE - set ENCRYPTION_KEY in your .env.local)"
    );
    console.warn(
      "⚠️  NOTE: If sharing a database between dev and production, use the SAME key in both environments"
    );
    return crypto.scryptSync("default-dev-key-change-in-production", "salt", KEY_LENGTH);
  }

  // If key is provided as hex string, decode it
  if (key.length === 64) {
    return Buffer.from(key, "hex");
  }

  // Otherwise, derive key from the provided string
  return crypto.scryptSync(key, "encryption-salt", KEY_LENGTH);
}

/**
 * Encrypts a string value
 * Returns a base64-encoded string containing: salt:iv:tag:encryptedData
 */
export function encrypt(value: string | null | undefined): string | null {
  if (!value) return null;

  try {
    const key = getEncryptionKey();
    const salt = crypto.randomBytes(SALT_LENGTH);
    const iv = crypto.randomBytes(IV_LENGTH);
    
    // Derive a key from the master key and salt
    const derivedKey = crypto.pbkdf2Sync(key, salt, ITERATIONS, KEY_LENGTH, "sha256");
    
    const cipher = crypto.createCipheriv(ALGORITHM, derivedKey, iv);
    
    let encrypted = cipher.update(value, "utf8", "base64");
    encrypted += cipher.final("base64");
    
    const tag = cipher.getAuthTag();
    
    // Combine salt:iv:tag:encryptedData
    const result = [
      salt.toString("base64"),
      iv.toString("base64"),
      tag.toString("base64"),
      encrypted,
    ].join(":");
    
    return result;
  } catch (error) {
    console.error("Encryption error:", error);
    throw new Error("Failed to encrypt data");
  }
}

/**
 * Decrypts an encrypted string
 * Expects format: salt:iv:tag:encryptedData
 */
export function decrypt(encryptedValue: string | null | undefined): string | null {
  if (!encryptedValue) return null;

  // Check if value is already decrypted (for migration compatibility)
  // Encrypted values always contain colons (salt:iv:tag:data)
  if (!encryptedValue.includes(":")) {
    // Likely unencrypted legacy data
    return encryptedValue;
  }

  try {
    const parts = encryptedValue.split(":");
    if (parts.length !== 4) {
      // Invalid format - might be unencrypted data
      console.warn("Invalid encrypted format, treating as unencrypted");
      return encryptedValue;
    }

    const [saltBase64, ivBase64, tagBase64, encrypted] = parts;
    
    const key = getEncryptionKey();
    const salt = Buffer.from(saltBase64, "base64");
    const iv = Buffer.from(ivBase64, "base64");
    const tag = Buffer.from(tagBase64, "base64");
    
    // Derive the same key from master key and salt
    const derivedKey = crypto.pbkdf2Sync(key, salt, ITERATIONS, KEY_LENGTH, "sha256");
    
    const decipher = crypto.createDecipheriv(ALGORITHM, derivedKey, iv);
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(encrypted, "base64", "utf8");
    decrypted += decipher.final("utf8");
    
    return decrypted;
  } catch (error) {
    console.error("Decryption error:", error);
    // If decryption fails, it might be unencrypted legacy data
    // Return as-is to allow migration
    return encryptedValue;
  }
}

/**
 * Encrypts a JSON object by stringifying it first
 */
export function encryptJson(value: any): string | null {
  if (value === null || value === undefined) return null;
  try {
    const jsonString = JSON.stringify(value);
    return encrypt(jsonString);
  } catch (error) {
    console.error("JSON encryption error:", error);
    throw new Error("Failed to encrypt JSON data");
  }
}

/**
 * Decrypts and parses a JSON object
 */
export function decryptJson<T = any>(encryptedValue: string | null | undefined): T | null {
  if (!encryptedValue) return null;
  
  const decrypted = decrypt(encryptedValue);
  if (!decrypted) return null;
  
  try {
    return JSON.parse(decrypted) as T;
  } catch (error) {
    console.error("JSON decryption error:", error);
    // If parsing fails, might be unencrypted legacy data
    // Try parsing directly
    try {
      return JSON.parse(encryptedValue) as T;
    } catch {
      return null;
    }
  }
}

/**
 * Encrypts an array of strings
 */
export function encryptStringArray(values: string[] | null | undefined): string[] | null {
  if (!values || values.length === 0) return values;
  return values.map((v) => encrypt(v) || v);
}

/**
 * Decrypts an array of encrypted strings
 */
export function decryptStringArray(encryptedValues: string[] | null | undefined): string[] | null {
  if (!encryptedValues || encryptedValues.length === 0) return encryptedValues;
  return encryptedValues.map((v) => decrypt(v) || v);
}

/**
 * Encrypts sensitive content within a Map nodes/edges JSON structure
 * This encrypts part names, labels, and other sensitive fields while preserving structure
 */
export function encryptMapData(mapData: {
  nodes?: any[];
  edges?: any[];
  title?: string;
  sidebarImpressions?: any;
}): {
  nodes?: any[];
  edges?: any[];
  title?: string;
  sidebarImpressions?: any;
} {
  const encrypted: any = {};

  // Encrypt map title
  if (mapData.title) {
    encrypted.title = encrypt(mapData.title);
  }

  // Encrypt nodes (parts, impressions, etc.)
  if (Array.isArray(mapData.nodes)) {
    encrypted.nodes = mapData.nodes.map((node) => {
      const encryptedNode = { ...node };
      
      // Encrypt node label/name
      if (encryptedNode.data?.label) {
        encryptedNode.data = { ...encryptedNode.data, label: encrypt(encryptedNode.data.label) };
      }
      if (encryptedNode.data?.name) {
        encryptedNode.data = { ...encryptedNode.data, name: encrypt(encryptedNode.data.name) };
      }
      if (encryptedNode.data?.title) {
        encryptedNode.data = { ...encryptedNode.data, title: encrypt(encryptedNode.data.title) };
      }

      // Encrypt part-specific fields
      if (encryptedNode.data?.scratchpad) {
        encryptedNode.data = { ...encryptedNode.data, scratchpad: encrypt(encryptedNode.data.scratchpad) };
      }
      if (Array.isArray(encryptedNode.data?.needs)) {
        encryptedNode.data = { ...encryptedNode.data, needs: encryptStringArray(encryptedNode.data.needs) };
      }
      if (Array.isArray(encryptedNode.data?.fears)) {
        encryptedNode.data = { ...encryptedNode.data, fears: encryptStringArray(encryptedNode.data.fears) };
      }
      if (encryptedNode.data?.customPartType) {
        encryptedNode.data = { ...encryptedNode.data, customPartType: encrypt(encryptedNode.data.customPartType) };
      }

      // Encrypt impression data within nodes
      if (encryptedNode.data?.customImpressionBuckets) {
        encryptedNode.data = {
          ...encryptedNode.data,
          customImpressionBuckets: encryptJson(encryptedNode.data.customImpressionBuckets),
        };
      }

      // Encrypt impression nodes within part data
      const impressionTypes = ['emotions', 'thoughts', 'sensations', 'behaviors', 'needs', 'fears', 'others'];
      impressionTypes.forEach((type) => {
        if (Array.isArray(encryptedNode.data?.[type])) {
          encryptedNode.data[type] = encryptedNode.data[type].map((imp: any) => ({
            ...imp,
            data: imp.data ? {
              ...imp.data,
              label: imp.data.label ? encrypt(imp.data.label) : imp.data.label,
            } : imp.data,
          }));
        }
      });

      return encryptedNode;
    });
  }

  // Edges don't typically contain sensitive data, but preserve them
  encrypted.edges = mapData.edges;

  // Encrypt sidebar impressions
  if (mapData.sidebarImpressions) {
    encrypted.sidebarImpressions = encryptJson(mapData.sidebarImpressions);
  }

  return encrypted;
}

/**
 * Decrypts sensitive content within a Map nodes/edges JSON structure
 */
export function decryptMapData(encryptedMapData: {
  nodes?: any[];
  edges?: any[];
  title?: string;
  sidebarImpressions?: any;
}): {
  nodes?: any[];
  edges?: any[];
  title?: string;
  sidebarImpressions?: any;
} {
  const decrypted: any = {};

  // Decrypt map title (handle unencrypted legacy data)
  if (encryptedMapData.title) {
    try {
      const decryptedTitle = decrypt(encryptedMapData.title);
      decrypted.title = decryptedTitle || encryptedMapData.title;
    } catch {
      decrypted.title = encryptedMapData.title;
    }
  }

  // Decrypt nodes (handle unencrypted legacy data gracefully)
  if (Array.isArray(encryptedMapData.nodes)) {
    decrypted.nodes = encryptedMapData.nodes.map((node) => {
      try {
        const decryptedNode = { ...node };
        
        // Decrypt node label/name
        if (decryptedNode.data?.label && typeof decryptedNode.data.label === 'string') {
          try {
            const decryptedLabel = decrypt(decryptedNode.data.label);
            if (decryptedLabel && decryptedLabel !== decryptedNode.data.label) {
              decryptedNode.data = { ...decryptedNode.data, label: decryptedLabel };
            }
          } catch {
            // Keep original if decryption fails
          }
        }
        if (decryptedNode.data?.name && typeof decryptedNode.data.name === 'string') {
          try {
            const decryptedName = decrypt(decryptedNode.data.name);
            if (decryptedName && decryptedName !== decryptedNode.data.name) {
              decryptedNode.data = { ...decryptedNode.data, name: decryptedName };
            }
          } catch {
            // Keep original if decryption fails
          }
        }
        if (decryptedNode.data?.title && typeof decryptedNode.data.title === 'string') {
          try {
            const decryptedTitle = decrypt(decryptedNode.data.title);
            if (decryptedTitle && decryptedTitle !== decryptedNode.data.title) {
              decryptedNode.data = { ...decryptedNode.data, title: decryptedTitle };
            }
          } catch {
            // Keep original if decryption fails
          }
        }

        // Decrypt part-specific fields
        if (decryptedNode.data?.scratchpad && typeof decryptedNode.data.scratchpad === 'string') {
          try {
            const decryptedScratchpad = decrypt(decryptedNode.data.scratchpad);
            if (decryptedScratchpad && decryptedScratchpad !== decryptedNode.data.scratchpad) {
              decryptedNode.data = { ...decryptedNode.data, scratchpad: decryptedScratchpad };
            }
          } catch {
            // Keep original if decryption fails
          }
        }
        if (Array.isArray(decryptedNode.data?.needs)) {
          try {
            decryptedNode.data = { ...decryptedNode.data, needs: decryptStringArray(decryptedNode.data.needs) };
          } catch {
            // Keep original if decryption fails
          }
        }
        if (Array.isArray(decryptedNode.data?.fears)) {
          try {
            decryptedNode.data = { ...decryptedNode.data, fears: decryptStringArray(decryptedNode.data.fears) };
          } catch {
            // Keep original if decryption fails
          }
        }
        if (decryptedNode.data?.customPartType && typeof decryptedNode.data.customPartType === 'string') {
          try {
            const decryptedType = decrypt(decryptedNode.data.customPartType);
            if (decryptedType && decryptedType !== decryptedNode.data.customPartType) {
              decryptedNode.data = { ...decryptedNode.data, customPartType: decryptedType };
            }
          } catch {
            // Keep original if decryption fails
          }
        }

        // Decrypt impression data within nodes
        if (decryptedNode.data?.customImpressionBuckets) {
          try {
            const decryptedBuckets = decryptJson(decryptedNode.data.customImpressionBuckets);
            if (decryptedBuckets) {
              decryptedNode.data = {
                ...decryptedNode.data,
                customImpressionBuckets: decryptedBuckets,
              };
            }
          } catch {
            // Keep original if decryption fails
          }
        }

        // Decrypt impression nodes within part data
        const impressionTypes = ['emotions', 'thoughts', 'sensations', 'behaviors', 'needs', 'fears', 'others'];
        impressionTypes.forEach((type) => {
          if (Array.isArray(decryptedNode.data?.[type])) {
            try {
              decryptedNode.data[type] = decryptedNode.data[type].map((imp: any) => {
                if (imp.data?.label && typeof imp.data.label === 'string') {
                  try {
                    const decryptedLabel = decrypt(imp.data.label);
                    if (decryptedLabel && decryptedLabel !== imp.data.label) {
                      return {
                        ...imp,
                        data: { ...imp.data, label: decryptedLabel },
                      };
                    }
                  } catch {
                    // Keep original if decryption fails
                  }
                }
                return imp;
              });
            } catch {
              // Keep original if decryption fails
            }
          }
        });

        return decryptedNode;
      } catch (error) {
        // If any error occurs, return node as-is (unencrypted legacy data)
        console.error("Error decrypting node:", error);
        return node;
      }
    });
  }

  // Edges don't need decryption
  decrypted.edges = encryptedMapData.edges;

  // Decrypt sidebar impressions
  if (encryptedMapData.sidebarImpressions) {
    try {
      const decryptedImpressions = decryptJson(encryptedMapData.sidebarImpressions);
      decrypted.sidebarImpressions = decryptedImpressions || encryptedMapData.sidebarImpressions;
    } catch {
      decrypted.sidebarImpressions = encryptedMapData.sidebarImpressions;
    }
  }

  return decrypted;
}
