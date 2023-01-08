import { FastifyBaseLogger } from "fastify";
import { formatTime } from "./formatTime";

export default function parse(txt: unknown, logger: FastifyBaseLogger): string {
  let rows;
  try {
    rows = JSON.parse(txt as string);
  } catch (e) {
    rows = [];
    logger.error(e);
  }

  return renderOpeningHours(rows as OpenDaysHierarchy);
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
type OpenHours = {
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
  [key in WeekDay]: OpenHours[];
};

function renderOpeningHours(data: OpenDaysHierarchy): string {
  const result: any[] = [];

  for (let weekday of weekdays) {
    const openHoursParts: OpenHours[] = data[weekday];
    const outputDay: string =
      weekday.charAt(0).toUpperCase() + weekday.slice(1);

    // todo handle case when previous day is still open
    // empty input - skip a row
    if (!openHoursParts || Object.keys(openHoursParts).length === 0) {
      result.push(`${outputDay}: Closed`);
      continue;
    }

    const currentRange: {
      from: number | null;
      to: number | null;
    } = {
      from: null,
      to: null,
    };

    for (const rangePart of openHoursParts) {
      if (rangePart.type === "open") {
        currentRange.from = rangePart.value;
      }

      if (rangePart.type === "close") {
        currentRange.to = rangePart.value;
      }

      if (
        currentRange.to &&
        currentRange.from &&
        currentRange.from < currentRange.to
      ) {
        result.push(
          `${outputDay}: ${formatTime(currentRange.from)} - ${formatTime(
            currentRange.to
          )}`
        );

        currentRange.to = null;
        currentRange.from = null;
      }
    }
  }

  return result.join("\n");
}
