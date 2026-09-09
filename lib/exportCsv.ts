import { toast } from "sonner";
import { getCookie } from "@/lib/cookies";
import { API_BASE_URL, AUTH_TOKEN_KEY } from "@/redux/constants";

export type ExportReportType = "orders" | "service-requests" | "customers" | "invoices";

interface CsvColumn<T> {
  header: string;
  accessor: (row: T) => string | number | boolean | null | undefined;
}

function convertToCsv<T>(data: T[], columns: CsvColumn<T>[]): string {
  const headerRow = columns.map((col) => `"${col.header.replace(/"/g, '""')}"`).join(",");
  const dataRows = data.map((row) =>
    columns
      .map((col) => {
        const val = col.accessor(row);
        if (val === null || val === undefined) return '""';
        return `"${String(val).replace(/"/g, '""')}"`;
      })
      .join(","),
  );
  return [headerRow, ...dataRows].join("\r\n");
}

function triggerDownload(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
}

export async function downloadReportCsv<T>(
  type: ExportReportType,
  fallbackRows?: T[],
  fallbackColumns?: CsvColumn<T>[],
): Promise<void> {
  const filename = `${type}-export-${new Date().toISOString().slice(0, 10)}.csv`;

  try {
    const token = getCookie(AUTH_TOKEN_KEY);
    const url = `${API_BASE_URL}/reports/export/${type}/csv`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (response.ok) {
      const blob = await response.blob();
      triggerDownload(blob, filename);
      toast.success(`Exported ${type.replace("-", " ")} CSV.`);
      return;
    }
  } catch {
    // Backend endpoint unavailable or network offline, proceed to client fallback
  }

  // Fallback to client-side CSV generation
  if (fallbackRows && fallbackColumns && fallbackRows.length > 0) {
    const csvContent = convertToCsv(fallbackRows, fallbackColumns);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    triggerDownload(blob, filename);
    toast.success(`Exported ${type.replace("-", " ")} CSV.`);
  } else {
    toast.error(`Unable to export ${type.replace("-", " ")} at this time.`);
  }
}
