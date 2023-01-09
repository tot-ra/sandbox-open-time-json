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
    aggregateTimeRangesByWeekDay(
      joinSequentialRanges(
        extractUniqueLoopableTimeRanges(
          sortAndFilterInput(rows as OpenDaysHierarchy)
        )
      )
    )
  );
}

function sortAndFilterInput(data: OpenDaysHierarchy): OpenDaysHierarchy {
  for (let weekday of weekdays) {
    let openHoursParts: TimeRangePartial[] = data[weekday];
    // empty input - skip a row
    if (!openHoursParts || Object.keys(openHoursParts).length === 0) {
      continue;
    }
    // sort open/close time in case its not sorted properly
    data[weekday].sort((a, b) => a.value - b.value);

    for (let key = 0; key < openHoursParts.length; key++) {
      let row = openHoursParts[key];
      if (row.value < 0 || row.value >= DAY_IN_SEC) {
        delete openHoursParts[key];
      }
    }

    data[weekday] = openHoursParts;
  }

  return data;
}

function extractUniqueLoopableTimeRanges(
  data: OpenDaysHierarchy
): TimeRangeMap {
  const result: TimeRangeMap = new Map();
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

  for (let dayKey: WeekDayIndex = 0; dayKey < weekdays.length; dayKey++) {
    const weekday = weekdays[dayKey];
    let openHoursParts: TimeRangePartial[] = data[weekday];

    // empty input - skip a row
    if (!openHoursParts || Object.keys(openHoursParts).length === 0) {
      continue;
    }

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
        if (result.size === 0 && currentRange.from === null) {
          loopRange = {
            to: rangePart.value,
            toDay: dayKey,
            from: null,
            fromDay: null,
          };
        }
      }

      if (
        currentRange.to &&
        currentRange.from &&
        currentRange.fromDay !== null
      ) {
        const isIncreasingTimeRange: boolean =
          //@ts-ignore
          DAY_IN_SEC * (currentRange.fromDay + 1) + currentRange.from <
          //@ts-ignore
          currentRange.to + DAY_IN_SEC * (currentRange.toDay + 1);

        if (isIncreasingTimeRange) {
          let timeRangeInWeekKey = getTimeRangeMapKey(
            currentRange.fromDay,
            currentRange.from
          );
          currentRange.fromDay * DAY_IN_SEC + currentRange.from;

          result.set(timeRangeInWeekKey, { ...currentRange } as TimeRange);

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
    if (
      loopRange.toDay === 0 &&
      currentRange.from !== null &&
      currentRange.fromDay === 6
    ) {
      let timeRangeInWeekKey = getTimeRangeMapKey(
        currentRange.fromDay,
        currentRange.from
      );

      result.set(timeRangeInWeekKey, {
        to: loopRange.to,
        toDay: loopRange.toDay,
        from: currentRange.from,
        fromDay: currentRange.fromDay,
      } as TimeRange);
    }
  }

  return result;
}

function getTimeRangeMapKey(day: WeekDayIndex, time: DayTime) {
  return day * DAY_IN_SEC + time;
}

function joinSequentialRanges(data: TimeRangeMap): TimeRangeMap {
  for (let [firstRangeKey, firstRange] of data.entries()) {
    while (true) {
      const secondRangeKey = getTimeRangeMapKey(
        firstRange.toDay,
        firstRange.to
      );
      const secondRange = data.get(secondRangeKey);

      if (!secondRange) {
        break;
      }

      firstRange = {
        ...firstRange,
        to: secondRange.to,
        toDay: secondRange.toDay,
      };

      data.set(firstRangeKey, firstRange);
      data.delete(secondRangeKey);
    }
  }

  return data;
}

function aggregateTimeRangesByWeekDay(
  data: TimeRangeMap
): Map<WeekDay, FormattedTimeRange[]> {
  const dayMap: Map<WeekDay, FormattedTimeRange[]> = new Map();

  for (const [, row] of data.entries()) {
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
  from: DayTime | null;
  to: DayTime | null;
  fromDay: WeekDayIndex | null;
  toDay: WeekDayIndex | null;
};

type FormattedTimeRange = string; // ex. 1 AM - 4 AM
type DayTime = number; // min 0, max DAY_IN_SEC
type WeekStartTime = number; //WeekDayIndex * DayTime

type TimeRangeMap = Map<WeekStartTime, TimeRange>;

type TimeRange = {
  from: DayTime;
  to: DayTime;

  fromDay: WeekDayIndex;
  toDay: WeekDayIndex;
};

type TimeRangePartial = {
  type: "open" | "close";
  value: number;
};

type WeekDayIndex = number; // 0-6
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
