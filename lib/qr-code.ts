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
  const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || "default-key", "salt", 32)
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv)
  let encrypted = cipher.update(JSON.stringify({ registration_id: registrationId }), "utf8", "hex")
  encrypted += cipher.final("hex")
  return iv.toString("hex") + ":" + encrypted
}

export function decryptQRToken(encrypted: string): { registration_id: number } | null {
  try {
    const [ivHex, encryptedHex] = encrypted.split(":")
    const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || "default-key", "salt", 32)
    const iv = Buffer.from(ivHex, "hex")
    const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv)
    let decrypted = decipher.update(encryptedHex, "hex", "utf8")
    decrypted += decipher.final("utf8")
    return JSON.parse(decrypted)
  } catch (error) {
    return null
  }
}
