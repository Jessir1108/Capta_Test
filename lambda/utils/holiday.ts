import axios, { AxiosError } from "axios";

const HOLIDAYS_URL = "https://content.capta.co/Recruitment/WorkingDays.json";
let cachedHolidays: Set<string> | null = null;

function toYmd(val: unknown): string | null {
  if (typeof val !== "string") return null;
  const cleaned = val.trim().replace(/\//g, "-");
  const ymd = cleaned.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(ymd) ? ymd : null;
}

export async function fetchHolidays(): Promise<Set<string>> {
  if (cachedHolidays) {
    console.log("Using cached holidays data:", { count: cachedHolidays.size });
    return cachedHolidays;
  }

  const MAX_RETRIES = 3;
  const TIMEOUT = 8000;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log("Holidays fetch start", { url: HOLIDAYS_URL, attempt });

      const res = await axios.get<unknown>(HOLIDAYS_URL, {
        timeout: TIMEOUT,
        headers: { Accept: "application/json" },
        validateStatus: () => true,
      });

      if (res.status < 200 || res.status >= 300) {
        console.error("Holidays fetch non-OK", {
          status: res.status,
          statusText: res.statusText,
          bodySnippet:
            typeof res.data === "string"
              ? res.data.slice(0, 200)
              : JSON.stringify(res.data || {}).slice(0, 200),
        });
        throw new Error(`Holidays HTTP ${res.status}`);
      }

      if (!Array.isArray(res.data)) {
        console.error("Holidays fetch invalid format (expected array)", {
          typeofData: typeof res.data,
        });
        throw new Error("Invalid holidays data format");
      }

      const holidays = new Set<string>();
      for (const d of res.data) {
        const ymd = toYmd(d);
        if (ymd) holidays.add(ymd);
      }

      if (holidays.size === 0) {
        console.error("Holidays parsed but empty", {
          sample: res.data.slice(0, 2),
        });
        throw new Error("Empty holidays after parsing");
      }

      cachedHolidays = holidays;
      console.log("Holidays fetch ok", {
        total: holidays.size,
        sample: Array.from(holidays).slice(0, 3),
      });
      return cachedHolidays;
    } catch (e) {
      const ax = e as AxiosError;
      console.error("Holidays fetch error", {
        attempt,
        isAxiosError: !!ax.isAxiosError,
        code: ax.code,
        message: ax.message,
        responseStatus: ax.response?.status,
        responseText:
          typeof ax.response?.data === "string"
            ? ax.response.data.slice(0, 200)
            : JSON.stringify(ax.response?.data || {}).slice(0, 200),
      });

      if (attempt === MAX_RETRIES) {
        throw new Error("Failed to fetch holidays data");
      }
      await new Promise((r) => setTimeout(r, 300 * attempt ** 2));
    }
  }

  throw new Error("Failed to fetch holidays data");
}

export function isHoliday(date: Date, holidays: Set<string>): boolean {
  const dateStr = date.toISOString().split("T")[0];
  const result = holidays.has(dateStr);
  console.log("isHoliday check", { date: dateStr, result });
  return result;
}
