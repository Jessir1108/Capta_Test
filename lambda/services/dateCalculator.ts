import { fromZonedTime, toZonedTime } from "date-fns-tz";
import {
  addDays,
  addMinutes,
  getDay,
  setHours,
  setMinutes,
  setSeconds,
  setMilliseconds,
} from "date-fns";
import { isHoliday } from "../utils/holiday";
import { HolidaysSet } from "../types";

const COLOMBIA_TZ = "America/Bogota" as const;
const WORK_START_HOUR = 8;
const WORK_END_HOUR = 17;
const LUNCH_START_HOUR = 12;
const LUNCH_END_HOUR = 13;

function clearSubSeconds(d: Date): Date {
  let x = setSeconds(d, 0);
  x = setMilliseconds(x, 0);
  return x;
}

export function isWorkingDay(date: Date, holidays: HolidaysSet): boolean {
  const day = getDay(date);
  return day !== 0 && day !== 6 && !isHoliday(date, holidays);
}

function atTime(date: Date, hour: number, minute = 0): Date {
  let x = setHours(date, hour);
  x = setMinutes(x, minute);
  return clearSubSeconds(x);
}

function previousWorkingDayEnd(date: Date, holidays: HolidaysSet): Date {
  let d = date;
  do {
    d = addDays(d, -1);
  } while (!isWorkingDay(d, holidays));
  return atTime(d, WORK_END_HOUR, 0);
}

function nextWorkingDayStart(date: Date, holidays: HolidaysSet): Date {
  let d = date;
  do {
    d = addDays(d, 1);
  } while (!isWorkingDay(d, holidays));
  return atTime(d, WORK_START_HOUR, 0);
}

export function isWorkingMinute(date: Date): boolean {
  const h = date.getHours();
  const m = date.getMinutes();
  const total = h * 60 + m;

  const startAM = WORK_START_HOUR * 60;
  const endAM = LUNCH_START_HOUR * 60;
  const startPM = LUNCH_END_HOUR * 60;
  const endPM = WORK_END_HOUR * 60;

  return (
    (total >= startAM && total < endAM) || (total >= startPM && total < endPM)
  );
}

export function adjustToWorkingTime(date: Date, holidays: HolidaysSet): Date {
  let d = clearSubSeconds(date);

  if (!isWorkingDay(d, holidays)) {
    return previousWorkingDayEnd(d, holidays);
  }

  const h = d.getHours();
  const m = d.getMinutes();

  if (h < WORK_START_HOUR) {
    return previousWorkingDayEnd(d, holidays);
  }

  if (h >= WORK_END_HOUR) {
    return atTime(d, WORK_END_HOUR, 0);
  }

  if (h >= LUNCH_START_HOUR && h < LUNCH_END_HOUR) {
    return atTime(d, LUNCH_START_HOUR, 0);
  }

  return d;
}

export function addWorkingDays(
  startDate: Date,
  daysToAdd: number,
  holidays: HolidaysSet
): Date {
  let d = clearSubSeconds(startDate);
  let remaining = daysToAdd;

  while (remaining > 0) {
    d = addDays(d, 1);
    if (isWorkingDay(d, holidays)) {
      remaining--;
    }
  }

  return d;
}

export function addWorkingHours(
  startDate: Date,
  hoursToAdd: number,
  holidays: HolidaysSet
): Date {
  let d = clearSubSeconds(startDate);
  let remaining = Math.round(hoursToAdd * 60);

  while (remaining > 0) {
    if (!isWorkingMinute(d)) {
      const h = d.getHours();
      if (h < WORK_START_HOUR) {
        d = atTime(d, WORK_START_HOUR, 0);
      } else if (h >= LUNCH_START_HOUR && h < LUNCH_END_HOUR) {
        d = atTime(d, LUNCH_END_HOUR, 0);
      } else if (h >= WORK_END_HOUR) {
        d = nextWorkingDayStart(d, holidays);
      }
      continue;
    }

    const h = d.getHours();
    const m = d.getMinutes();
    const total = h * 60 + m;

    const endAM = LUNCH_START_HOUR * 60;
    const endPM = WORK_END_HOUR * 60;

    const boundary = total < endAM ? endAM : endPM;
    const usable = Math.min(remaining, boundary - total);

    d = addMinutes(d, usable);
    remaining -= usable;

    if (remaining > 0) {
      const newH = d.getHours();
      if (newH === LUNCH_START_HOUR) {
        d = atTime(d, LUNCH_END_HOUR, 0);
      } else if (newH >= WORK_END_HOUR) {
        d = nextWorkingDayStart(d, holidays);
      }
    }
  }

  return clearSubSeconds(d);
}

export function calculateWorkingDate(
  startDateUTC: Date | null,
  days: number,
  hours: number,
  holidays: HolidaysSet
): Date {
  const zonedStart = toZonedTime(startDateUTC ?? new Date(), COLOMBIA_TZ);

  let d = adjustToWorkingTime(zonedStart, holidays);

  if (days > 0) d = addWorkingDays(d, days, holidays);
  if (hours > 0) d = addWorkingHours(d, hours, holidays);

  return fromZonedTime(d, COLOMBIA_TZ);
}
