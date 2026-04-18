import QRCode from "qrcode";
import sharp from "sharp";
import path from "path";
import fs from "fs";

export interface VoucherData {
  voucherCode: string;
  clientName: string;
  rewardName: string;
  rewardDescription?: string;
  pointsSpent: number;
  issuedDate: string;
  expiryDate: string;
  verifyUrl: string;
}

function escapeXml(str: string): string {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if ((current + " " + word).trim().length <= maxChars) {
      current = (current + " " + word).trim();
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export async function generateVoucherImage(data: VoucherData): Promise<Buffer> {
  // Generate QR code as base64 PNG
  const qrBuffer = await QRCode.toBuffer(data.verifyUrl, {
    width: 110,
    margin: 1,
    color: { dark: "#1e3a5f", light: "#ffffff" },
  });
  const qrBase64 = `data:image/png;base64,${qrBuffer.toString("base64")}`;

  const rewardLines = wrapText(escapeXml(data.rewardName), 32);
  const descLines = data.rewardDescription
    ? wrapText(escapeXml(data.rewardDescription), 48)
    : [];

  const rewardY = 185;
  const descStartY = rewardY + rewardLines.length * 34 + 10;

  const svg = `<svg width="820" height="480" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="navyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1a3354;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#24487a;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="goldAccent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#c49a1a;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#e8b84b;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#c49a1a;stop-opacity:1" />
    </linearGradient>
    <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#00000033"/>
    </filter>
  </defs>

  <!-- Outer background -->
  <rect width="820" height="480" fill="url(#navyGrad)" rx="18"/>

  <!-- Gold border lines -->
  <rect x="12" y="12" width="796" height="456" fill="none" stroke="#e8b84b" stroke-width="1.5" rx="14" opacity="0.5"/>

  <!-- Gold top stripe -->
  <rect x="0" y="0" width="820" height="7" fill="url(#goldAccent)" rx="18"/>
  <rect x="0" y="473" width="820" height="7" fill="url(#goldAccent)" rx="18"/>

  <!-- White card body -->
  <rect x="30" y="28" width="760" height="424" fill="#ffffff" rx="10" filter="url(#shadow)"/>

  <!-- Header navy band -->
  <rect x="30" y="28" width="760" height="100" fill="url(#navyGrad)" rx="10"/>
  <rect x="30" y="98" width="760" height="30" fill="url(#navyGrad)"/>

  <!-- CB Travel logo text -->
  <text x="410" y="75" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="36" font-weight="bold" fill="#e8b84b" letter-spacing="2">CB Travel</text>
  <text x="410" y="100" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="12" fill="#c4d4e8" letter-spacing="6">LOYALTY REWARDS VOUCHER</text>

  <!-- Gold divider -->
  <rect x="50" y="128" width="720" height="2" fill="url(#goldAccent)" opacity="0.8"/>

  <!-- Diamond decorations on divider -->
  <polygon points="410,122 418,129 410,136 402,129" fill="#e8b84b"/>

  <!-- Reward name -->
  ${rewardLines.map((line, i) => `<text x="410" y="${rewardY + i * 34}" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="${rewardLines.length > 1 ? 26 : 30}" font-weight="bold" fill="#1e3a5f">${line}</text>`).join("\n  ")}

  <!-- Description lines -->
  ${descLines.slice(0, 2).map((line, i) => `<text x="410" y="${descStartY + i * 22}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="13" fill="#555555">${line}</text>`).join("\n  ")}

  <!-- Voucher code box -->
  <rect x="180" y="258" width="460" height="58" fill="#f0f4f8" rx="6" stroke="#1e3a5f" stroke-width="1.5"/>
  <rect x="180" y="258" width="460" height="6" fill="url(#navyGrad)" rx="6"/>
  <text x="410" y="293" text-anchor="middle" font-family="'Courier New', Courier, monospace" font-size="26" font-weight="bold" fill="#1e3a5f" letter-spacing="4">${escapeXml(data.voucherCode)}</text>
  <text x="410" y="310" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="10" fill="#888888" letter-spacing="3">VOUCHER CODE</text>

  <!-- Left info column -->
  <text x="70" y="348" font-family="Arial, Helvetica, sans-serif" font-size="11" fill="#888888" letter-spacing="1">ISSUED TO</text>
  <text x="70" y="368" font-family="Georgia, serif" font-size="15" font-weight="bold" fill="#1e3a5f">${escapeXml(data.clientName)}</text>

  <text x="70" y="395" font-family="Arial, Helvetica, sans-serif" font-size="11" fill="#888888" letter-spacing="1">VALID UNTIL</text>
  <text x="70" y="415" font-family="Georgia, serif" font-size="15" font-weight="bold" fill="#1e3a5f">${escapeXml(data.expiryDate)}</text>

  <!-- Points spent badge -->
  <rect x="300" y="335" width="160" height="50" fill="#1e3a5f" rx="25"/>
  <text x="380" y="355" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" fill="#e8b84b" letter-spacing="1">POINTS REDEEMED</text>
  <text x="380" y="375" text-anchor="middle" font-family="Georgia, serif" font-size="18" font-weight="bold" fill="#ffffff">${data.pointsSpent.toLocaleString()}</text>

  <!-- QR code -->
  <rect x="670" y="270" width="90" height="90" fill="#ffffff" rx="4" stroke="#e8b84b" stroke-width="1.5"/>
  <image x="675" y="275" width="80" height="80" href="${qrBase64}"/>
  <text x="715" y="375" text-anchor="middle" font-family="Arial, sans-serif" font-size="9" fill="#888888">SCAN TO VERIFY</text>

  <!-- Signature area -->
  <line x1="50" y1="432" x2="250" y2="432" stroke="#e8b84b" stroke-width="1" opacity="0.6"/>
  <text x="150" y="448" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="20" font-style="italic" fill="#1e3a5f">C. Barnes</text>
  <text x="150" y="462" text-anchor="middle" font-family="Arial, sans-serif" font-size="9" fill="#888888" letter-spacing="1">AUTHORISED SIGNATURE — CB TRAVEL</text>

  <!-- How to redeem -->
  <text x="500" y="445" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" fill="#555555">Email: hello@travelcb.co.uk</text>
  <text x="500" y="462" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" fill="#555555">WhatsApp: 07534 168295</text>

  <!-- Issued date footer note -->
  <text x="760" y="462" text-anchor="end" font-family="Arial, sans-serif" font-size="9" fill="#aaaaaa">Issued: ${escapeXml(data.issuedDate)} · travelcb.co.uk</text>
</svg>`;

  const pngBuffer = await sharp(Buffer.from(svg)).png({ quality: 95 }).toBuffer();
  return pngBuffer;
}

export async function saveVoucherImage(
  data: VoucherData,
  outputDir: string
): Promise<string> {
  fs.mkdirSync(outputDir, { recursive: true });
  const filename = `voucher-${data.voucherCode}.png`;
  const filePath = path.join(outputDir, filename);
  const buffer = await generateVoucherImage(data);
  fs.writeFileSync(filePath, buffer);
  return filePath;
}
