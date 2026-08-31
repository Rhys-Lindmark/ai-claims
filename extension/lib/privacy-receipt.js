function canonicalValue(value) {
  if (Array.isArray(value)) return value.map(canonicalValue);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalValue(value[key])]));
  return value;
}

export function canonicalPrivacyReceipt(receipt) {
  return JSON.stringify(canonicalValue(receipt));
}

export async function privacyReceiptArtifact(receipt, cryptoImpl = globalThis.crypto) {
  const payload = canonicalPrivacyReceipt(receipt);
  const bytes = new TextEncoder().encode(payload);
  const digest = await cryptoImpl.subtle.digest('SHA-256', bytes);
  const digestHex = [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  const suffix = receipt.last_reset_at?.slice(0, 10) ?? 'never-reset';
  const document = {
    ...receipt,
    integrity: {
      algorithm: 'SHA-256',
      canonicalization: 'recursive-key-sort-json-utf8',
      digest_scope: 'receipt_without_integrity',
      digest_hex: digestHex,
    },
  };
  return {
    filename: `ai-claims-privacy-receipt-${suffix}.json`,
    content: `${JSON.stringify(document, null, 2)}\n`,
    mimeType: 'application/json',
    digestHex,
  };
}
