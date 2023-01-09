import { formatTime } from "./formatTime";
import {
  OpenDaysHierarchy,
  TimeRangePartial,
  TimeRangeMap,
  TimeRangeTemporary,
  WeekDayIndex,
  TimeRange,
  DayTime,
  WeekDay,
  FormattedTimeRange,
} from "./types";

const DAY_IN_SEC = 24 * 60 * 60;
const weekdays: WeekDay[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

export default function parse(rows: unknown): string {
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
  weekdays.forEach((weekday) => {
    let openHoursParts: TimeRangePartial[] = data[weekday];
    // empty input - skip a row
    if (!openHoursParts || Object.keys(openHoursParts).length === 0) {
      return;
    }
    // sort open/close time in case its not sorted properly
    data[weekday].sort((a, b) => a.value - b.value);

    // don't use .filter in case data is too large
    // no need to create new copy, cleanup existing structure
    for (let key = 0; key < openHoursParts.length; key++) {
      let row = openHoursParts[key];
      if (row.value < 0 || row.value >= DAY_IN_SEC) {
        delete openHoursParts[key];
      }
    }

    data[weekday] = openHoursParts;
  });

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
        currentRange.fromDay !== null &&
        currentRange.toDay !== null
      ) {
        const isIncreasingTimeRange: boolean =
          DAY_IN_SEC * (currentRange.fromDay + 1) + currentRange.from <
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