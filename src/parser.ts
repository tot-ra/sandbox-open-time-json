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
    let dayKey = Math.floor(row.from / DAY_IN_SEC);
    let weekday = weekdays[dayKey];
    let timeRanges = dayMap.get(weekday);

    if (!timeRanges) {
      timeRanges = [];
    }

    // todo needs improvement for multiple day ranges
    timeRanges.push(
      `${formatTime(row.from - dayKey * DAY_IN_SEC)} - ${formatTime(
        row.to - dayKey * DAY_IN_SEC
      )}`
    );

    dayMap.set(weekday, timeRanges);
  }

  return dayMap;
}

function extractTimeRanges(data: OpenDaysHierarchy): TimeRange[] {
  const result: TimeRange[] = [];

  for (let dayKey = 0; dayKey < weekdays.length; dayKey++) {
    const weekday = weekdays[dayKey];
    const openHoursParts: TimeRangePartial[] = data[weekday];

    // todo handle case when previous day is still open
    // empty input - skip a row
    if (!openHoursParts || Object.keys(openHoursParts).length === 0) {
      continue;
    }

    const currentRange: TimeRangeTemporary = {
      from: null,
      to: null,
    };

    for (const rangePart of openHoursParts) {
      if (rangePart.type === "open") {
        currentRange.from = rangePart.value + dayKey * 24 * 60 * 60;
      }

      if (rangePart.type === "close") {
        currentRange.to = rangePart.value + dayKey * 24 * 60 * 60;
      }

      if (
        currentRange.to &&
        currentRange.from &&
        currentRange.from < currentRange.to
      ) {
        result.push({...currentRange} as TimeRange);

        currentRange.to = null;
        currentRange.from = null;
      }
    }
  }

//   console.log({result});
  return result;
  //.join("\n");
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
};

type FormattedTimeRange = string;

type TimeRange = {
  from: number;
  to: number;
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
