export type TimeRangeTemporary = {
  from: DayTime | null;
  to: DayTime | null;
  fromDay: WeekDayIndex | null;
  toDay: WeekDayIndex | null;
};
export type FormattedTimeRange = string; // ex. 1 AM - 4 AM

export type DayTime = number; // min 0, max DAY_IN_SEC

type WeekStartTime = number; //WeekDayIndex * DayTime

export type TimeRangeMap = Map<WeekStartTime, TimeRange>;
export type TimeRange = {
  from: DayTime;
  to: DayTime;

  fromDay: WeekDayIndex;
  toDay: WeekDayIndex;
};
export type TimeRangePartial = {
  type: "open" | "close";
  value: number;
};
export type WeekDayIndex = number; // 0-6

export type WeekDay =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export type OpenDaysHierarchy = {
  [key in WeekDay]: TimeRangePartial[];
};
