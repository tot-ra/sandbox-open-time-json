import { FastifyBaseLogger } from "fastify";

export default function parse(txt: unknown, logger: FastifyBaseLogger): string {
  let rows;
  try {
    rows = JSON.parse(txt as string);
  } catch (e) {
    rows = [];
    logger.error(e);
  }
  return renderOpeningHours(rows as OpenDays);
}

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

type OpenDays = {
  [key in WeekDay]: OpenHours[];
};

function renderOpeningHours(data: OpenDays): string {
  const weekdays: WeekDay[] = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];

  const result: any[] = [];

  for (let weekday of weekdays) {
    const hours: OpenHours[] = data[weekday];
    const day = weekday.charAt(0).toUpperCase() + weekday.slice(1);

    if (!hours || Object.keys(hours).length === 0) {
      result.push(`${day}: Closed`);
      continue;
    }

  }

  return result.join("\n");
}