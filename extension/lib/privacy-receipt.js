export function downloadablePrivacyReceipt(receipt) {
  const suffix = receipt.last_reset_at?.slice(0, 10) ?? 'never-reset';
  return {
    filename: `ai-claims-privacy-receipt-${suffix}.json`,
    content: `${JSON.stringify(receipt, null, 2)}\n`,
    mimeType: 'application/json',
  };
}
