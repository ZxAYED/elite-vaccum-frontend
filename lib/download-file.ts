/**
 * Saves a fetched blob to the user's disk.
 *
 * Invoice PDFs come back as an authenticated binary stream, so they can't be a
 * plain `<a href>` — the bearer token would never be sent. The blob is fetched
 * through RTK Query and handed here.
 */
export function saveBlobAsFile(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Revoking immediately can cancel the download in some browsers.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** `INV-202609-0001` -> `INV-202609-0001.pdf`, with a safe fallback. */
export function invoiceFileName(reference?: string) {
  const safe = (reference || "invoice").replace(/[^a-zA-Z0-9._-]/g, "-");
  return safe.toLowerCase().endsWith(".pdf") ? safe : `${safe}.pdf`;
}
