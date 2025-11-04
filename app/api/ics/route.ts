import { generateIcs } from "../../../lib/ics";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const start = url.searchParams.get("start");
  const hour = parseInt(url.searchParams.get("hour") || "9", 10);
  const minute = parseInt(url.searchParams.get("minute") || "0", 10);

  const startLocal = (() => {
    try {
      if (!start) throw new Error("no start");
      const [y, m, d] = start.split("-").map((v) => parseInt(v, 10));
      const date = new Date();
      date.setFullYear(y, m - 1, d);
      date.setHours(0, 0, 0, 0);
      return date;
    } catch {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return today;
    }
  })();

  const body = generateIcs(startLocal, hour, minute);
  return new Response(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": "attachment; filename=20-day-python-ai.ics",
      "Cache-Control": "no-store",
    },
  });
}
