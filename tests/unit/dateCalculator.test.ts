import { calculateWorkingDate } from "../../lambda/services/dateCalculator";
import type { HolidaysSet } from "../../lambda/types";

const emptyHolidays: HolidaysSet = new Set();

describe("dateCalculator (unit)", () => {
  test("hours=1 un viernes 17:00 → lunes 09:00 COL", () => {
    // Viernes 17:00 COL = 22:00 UTC aprox (sin DST en COL)
    const startUTC = new Date("2025-05-23T22:00:00Z");
    const resultUTC = calculateWorkingDate(startUTC, 0, 1, emptyHolidays);
    expect(resultUTC.toISOString()).toBe("2025-05-26T14:00:00.000Z"); // 09:00 COL = 14:00Z
  });

  test("days=1 y hours=4 desde martes 15:00 COL → jueves 10:00 COL", () => {
    const tuesday1500 = new Date("2025-05-13T20:00:00Z"); // 15:00 COL
    const resultUTC = calculateWorkingDate(tuesday1500, 1, 4, emptyHolidays);
    // Jueves 10:00 COL = 15:00Z
    expect(resultUTC.toISOString()).toBe("2025-05-15T15:00:00.000Z");
  });

  test("considera festivos (ej: 2025-04-17 y 2025-04-18)", () => {
    const holidays: HolidaysSet = new Set(["2025-04-17", "2025-04-18"]);
    const startUTC = new Date("2025-04-10T15:00:00.000Z"); // Jueves 10 Abr 10:00 COL
    const resultUTC = calculateWorkingDate(startUTC, 5, 4, holidays);
    expect(resultUTC.toISOString()).toBe("2025-04-21T20:00:00.000Z"); // Lun 21 Abr 15:00 COL
  });
});
