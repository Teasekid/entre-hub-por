
/**
 * Extracts and normalizes the setup token from a provided string (direct or from URL param).
 */
export function extractSetupToken(input: string): string {
  if (!input) return "";
  // Try URL param e.g. ...?token=abcd...
  const urlMatch = input.match(/[?&]token=([a-fA-F0-9]{64})/);
  if (urlMatch) return urlMatch[1];
  // Pure hex string
  const hexMatch = input.match(/^[a-fA-F0-9]{64}$/);
  if (hexMatch) return hexMatch[0];
  // Find token "some text abcd1234..."
  const fallback = input.match(/([a-fA-F0-9]{64})/);
  if (fallback) return fallback[1];
  return input.trim();
}
