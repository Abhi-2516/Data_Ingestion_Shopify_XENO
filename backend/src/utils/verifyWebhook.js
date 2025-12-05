const crypto = require('crypto');
/**
 * verify HMAC-SHA256 signature - returns true if matches.
 * signatureHeader: base64 or hex depending on sender; this function assumes base64.
 * secret: tenant webhook secret string
 */
function verifySignature(rawBodyBuffer, signatureHeader, secret) {
  if (!signatureHeader || !secret) return false;
  // compute hmac sha256 and base64 encode
  const hmac = crypto.createHmac('sha256', secret).update(rawBodyBuffer).digest('base64');
  // compare in constant-time
  return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(signatureHeader));
}
module.exports = { verifySignature };
