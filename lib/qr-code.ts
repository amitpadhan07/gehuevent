import QRCode from "qrcode"
import crypto from "crypto"

export async function generateQRCode(registrationId: number, eventId: number): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex")
  const payload = JSON.stringify({
    registration_id: registrationId,
    event_id: eventId,
    token: token,
    timestamp: Date.now(),
  })

  try {
    const qrDataUrl = await QRCode.toDataURL(payload, {
      errorCorrectionLevel: "H",
      type: "image/png",
      quality: 0.95,
      margin: 1,
      width: 300,
    })
    return qrDataUrl
  } catch (error) {
    console.error("Error generating QR code:", error)
    throw new Error("Failed to generate QR code")
  }
}

export function encryptQRToken(registrationId: number): string {
  const cipher = crypto.createCipher("aes-256-cbc", process.env.ENCRYPTION_KEY || "default-key")
  let encrypted = cipher.update(JSON.stringify({ registration_id: registrationId }), "utf8", "hex")
  encrypted += cipher.final("hex")
  return encrypted
}

export function decryptQRToken(encrypted: string): { registration_id: number } | null {
  try {
    const decipher = crypto.createDecipher("aes-256-cbc", process.env.ENCRYPTION_KEY || "default-key")
    let decrypted = decipher.update(encrypted, "hex", "utf8")
    decrypted += decipher.final("utf8")
    return JSON.parse(decrypted)
  } catch (error) {
    return null
  }
}
