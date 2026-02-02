# Data Encryption Setup

## Overview

Sensitive user data is now encrypted at rest in the database. This includes:
- **Journal Entries**: `contentJson`, `contentText`, `title`
- All journal content is encrypted before being stored in the database

## Setup Instructions

### 1. Generate an Encryption Key

You need to generate a secure 256-bit (32-byte) encryption key. You can do this in several ways:

**Option A: Using Node.js**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Option B: Using OpenSSL**
```bash
openssl rand -hex 32
```

**Option C: Using Python**
```python
import secrets
print(secrets.token_hex(32))
```

### 2. Set Environment Variable

Add the encryption key to your environment variables:

**Development (.env.local or .env)**
```env
ENCRYPTION_KEY=your-64-character-hex-key-here
```

**Note:** Next.js loads `.env.local` automatically and it's gitignored. You can also use `.env` - both are ignored by git (see `.gitignore`).

**Production (Vercel/Other hosting)**
Set `ENCRYPTION_KEY` in your hosting platform's environment variables.

⚠️ **IMPORTANT**: 
- Never commit the encryption key to version control
- **If using the same database for dev and production, use the SAME key** - otherwise data encrypted in one environment won't be decryptable in the other
- If using separate databases, you can use different keys for better security isolation
- Store the key securely (use a secrets manager in production)
- If you lose the key, encrypted data cannot be recovered

### 3. How It Works

- **Encryption**: Data is encrypted using AES-256-GCM (authenticated encryption)
- **Key Derivation**: Uses PBKDF2 with 100,000 iterations for key derivation
- **Storage Format**: Encrypted data is stored as base64 strings in the format: `salt:iv:tag:encryptedData`

### 4. Migration from Unencrypted Data

The encryption system is backward-compatible:
- New data is automatically encrypted when saved
- When reading data, the system attempts to decrypt
- If decryption fails (e.g., unencrypted legacy data), it returns the value as-is
- You can gradually migrate existing data by re-saving it through the API

### 5. What Gets Encrypted

**Journal Entries:**
- `contentJson` - The Lexical editor state (JSON)
- `contentText` - Plain text version for search
- `title` - Journal entry titles

**Maps (Workspaces):**
- `title` - Map/workspace titles
- `nodes` - All sensitive content within nodes:
  - Part names (`data.name`, `data.label`, `data.title`)
  - Part scratchpads (`data.scratchpad`)
  - Part needs and fears arrays (`data.needs`, `data.fears`)
  - Custom part types (`data.customPartType`)
  - Custom impression buckets (`data.customImpressionBuckets`)
  - Impression labels within parts (`data.emotions`, `data.thoughts`, etc.)
- `sidebarImpressions` - Sidebar impression data (JSON)

**All sensitive user content is now encrypted**, including:
- All journal entries
- All part names and personal information
- All impressions and their labels
- All workspace/map titles
- All scratchpad notes

### 6. Security Notes

- Encryption happens at the application level (before database storage)
- The database stores encrypted strings, not plain text
- Even with database access, data remains encrypted without the key
- Each encryption uses a unique salt and IV for security

### 7. Key Security & Risk Management

**If the encryption key is COMPROMISED (stolen/leaked):**
- ⚠️ **The attacker can decrypt all encrypted data**
- This is a serious security breach
- You should:
  1. Immediately rotate to a new key (see Key Rotation below)
  2. Notify affected users
  3. Investigate how the key was compromised
  4. Review access logs

**If the encryption key is LOST (deleted/forgotten):**
- ⚠️ **All encrypted data becomes permanently unreadable**
- This is why key backup is critical
- Always store your key in a secure secrets manager with backup

**Key Rotation Strategy:**
If your key is compromised, you'll need to:
1. Generate a new encryption key
2. Re-encrypt all existing data with the new key
3. This requires reading all encrypted records, decrypting with old key, re-encrypting with new key
4. Consider implementing a key versioning system for gradual rotation

**Best Practices:**
- Store keys in a secrets manager (AWS Secrets Manager, HashiCorp Vault, etc.)
- Use key rotation policies
- Limit access to keys (only application servers need it)
- Monitor for key access/usage
- Consider using a key management service (KMS) that handles rotation automatically

### 8. Troubleshooting

**Error: "ENCRYPTION_KEY environment variable is required"**
- Make sure you've set the `ENCRYPTION_KEY` environment variable
- Restart your development server after setting it

**Data appears encrypted in database but works in app**
- This is expected! The app automatically decrypts data when reading

**Need to re-encrypt existing data**
- Data will be encrypted automatically when users save/update their entries
- No manual migration needed - happens gradually as users use the app
