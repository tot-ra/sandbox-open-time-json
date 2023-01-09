import { FastifyBaseLogger } from "fastify";
import { formatTime } from "./formatTime";

const DAY_IN_SEC = 24 * 60 * 60;

export default function parse(txt: unknown, logger: FastifyBaseLogger): string {
  let rows;
  try {
    rows = JSON.parse(txt as string);
  } catch (e) {
    rows = [];
    logger.error(e);
  }

  return printWeekDayTimeMap(
    aggregateTimeRangesByWeekDay(extractTimeRanges(rows as OpenDaysHierarchy))
  );
}

function printWeekDayTimeMap(data: Map<WeekDay, FormattedTimeRange[]>): string {
  const result = [];

  for (let weekday of weekdays) {
    const outputDay: string =
      weekday.charAt(0).toUpperCase() + weekday.slice(1);
    let times = data.get(weekday);

    result.push(`${outputDay}: ${times ? times.join(", ") : "Closed"}`);
  }

  return result.join("\n");
}

function aggregateTimeRangesByWeekDay(
  data: TimeRange[]
): Map<WeekDay, FormattedTimeRange[]> {
  const dayMap: Map<WeekDay, FormattedTimeRange[]> = new Map();

  for (let row of data) {
    let dayKey = row.fromDay;
    let weekday = weekdays[dayKey];
    let timeRanges = dayMap.get(weekday);

    if (!timeRanges) {
      timeRanges = [];
    }

    // todo needs improvement for multiple day ranges
    timeRanges.push(`${formatTime(row.from)} - ${formatTime(row.to)}`);

    dayMap.set(weekday, timeRanges);
  }

  return dayMap;
}

function extractTimeRanges(data: OpenDaysHierarchy): TimeRange[] {
  const result: TimeRange[] = [];
  let currentRange: TimeRangeTemporary = {
    from: null,
    to: null,
    fromDay: null,
    toDay: null,
  };

  // possible element in case of sunday -> monday loop
  let loopRange: TimeRangeTemporary = {
    from: null,
    to: null,
    fromDay: null,
    toDay: null,
  };

  for (let dayKey = 0; dayKey < weekdays.length; dayKey++) {
    const weekday = weekdays[dayKey];
    const openHoursParts: TimeRangePartial[] = data[weekday];

    // empty input - skip a row
    if (!openHoursParts || Object.keys(openHoursParts).length === 0) {
      continue;
    }

    // sort open/close time in case its not sorted properly
    openHoursParts.sort((a, b) => a.value - b.value);

    for (const rangePart of openHoursParts) {
      if (rangePart.type === "open") {
        currentRange = {
          ...currentRange,
          from: rangePart.value,
          fromDay: dayKey,
        };
      }

      if (rangePart.type === "close") {
        currentRange = {
          ...currentRange,
          to: rangePart.value,
          toDay: dayKey,
        };

        // if first day of the week starts with close date
        // most likely there is a loop
        if (result.length === 0 && currentRange.from ===null) {
          loopRange = {
            to: rangePart.value,
            toDay: dayKey,
            from: null,
            fromDay: null
          };
        }
      }

      if (currentRange.to && currentRange.from) {
        const isIncreasingTimeRange: boolean =
          //@ts-ignore
          DAY_IN_SEC * (currentRange.fromDay + 1) + currentRange.from <
          //@ts-ignore
          currentRange.to + DAY_IN_SEC * (currentRange.toDay + 1);

        if (isIncreasingTimeRange) {
          result.push({ ...currentRange } as TimeRange);

          currentRange = {
            from: null,
            to: null,
            fromDay: null,
            toDay: null,
          };
        }
      }
    }

    // SUN - MON loop only 
    // to avoid single day looping onto itself
    // or MON - WED ranges
    if (loopRange.toDay === 0 && currentRange.fromDay === 6) {
      result.push({
        to: loopRange.to,
        toDay: loopRange.toDay,
        from: currentRange.from,
        fromDay: currentRange.fromDay,
      } as TimeRange);
    }
  }

  return result;
}

const weekdays: WeekDay[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

// types
type TimeRangeTemporary = {
  from: number | null;
  to: number | null;
  fromDay: number | null;
  toDay: number | null;
};

type FormattedTimeRange = string;

type TimeRange = {
  from: number;
  to: number;
  fromDay: number;
  toDay: number;
};

type TimeRangePartial = {
  type: "open" | "close";
  value: number;
};

type WeekDay =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

type OpenDaysHierarchy = {
  [key in WeekDay]: TimeRangePartial[];
};
