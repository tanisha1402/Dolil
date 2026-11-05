export type FileKind = "pdf" | "image" | "text";

const startsWith = (b: Buffer, bytes: number[], offset = 0) => bytes.every((v, i) => b[offset + i] === v);

/** Detect by content, never by file name or client-supplied MIME type. */
export function detectKind(buf: Buffer): FileKind | null {
  if (buf.length === 0) return null;
  if (buf.subarray(0, 1024).includes(Buffer.from("%PDF-"))) return "pdf";
  if (startsWith(buf, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image"; // PNG
  if (startsWith(buf, [0xff, 0xd8, 0xff])) return "image"; // JPEG
  if (startsWith(buf, [0x52, 0x49, 0x46, 0x46]) && startsWith(buf, [0x57, 0x45, 0x42, 0x50], 8)) return "image"; // WebP
  const head = buf.subarray(0, 8192);
  if (head.includes(0)) return null;
  try {
    new TextDecoder("utf-8", { fatal: true }).decode(buf);
    return "text";
  } catch {
    return null;
  }
}

export function imageMime(buf: Buffer): string | null {
  if (startsWith(buf, [0x89, 0x50, 0x4e, 0x47])) return "image/png";
  if (startsWith(buf, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (startsWith(buf, [0x52, 0x49, 0x46, 0x46]) && startsWith(buf, [0x57, 0x45, 0x42, 0x50], 8)) return "image/webp";
  return null;
}
