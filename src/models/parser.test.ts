import parse from "./parser";
import { TimeRangePartial } from "./types";

it("Simple monday 9-10:30", () => {
  const result = parse({
    monday: [
      {
        type: "open",
        value: 32400,
      },
      {
        type: "close",
        value: 37800,
      },
    ],
  });

  expect(result).toEqual(
    `Monday: 9 AM - 10:30 AM
Tuesday: Closed
Wednesday: Closed
Thursday: Closed
Friday: Closed
Saturday: Closed
Sunday: Closed`
  );
});

it("Multiple times per day 9-10:30, 11-20", () => {
  const result = parse({
    monday: [
      {
        type: "open",
        value: 9 * 60 * 60,
      },
      {
        type: "close",
        value: 10 * 60 * 60 + 30 * 60,
      },
      {
        type: "open",
        value: 11 * 60 * 60,
      },
      {
        type: "close",
        value: 20 * 60 * 60,
      },
    ],
  });

  expect(result).toEqual(
    `Monday: 9 AM - 10:30 AM, 11 AM - 8 PM
Tuesday: Closed
Wednesday: Closed
Thursday: Closed
Friday: Closed
Saturday: Closed
Sunday: Closed`
  );
});

it("Multiple days time", () => {
  const result = parse({
    friday: [
      {
        type: "open",
        value: 18 * 60 * 60,
      },
    ],
    saturday: [
      {
        type: "close",
        value: 60 * 60,
      },
      {
        type: "open",
        value: 9 * 60 * 60,
      },
      {
        type: "close",
        value: 11 * 60 * 60,
      },
      {
        type: "open",
        value: 16 * 60 * 60,
      },
      {
        type: "close",
        value: 23 * 60 * 60,
      },
    ],
  });

  expect(result).toEqual(
    `Monday: Closed
Tuesday: Closed
Wednesday: Closed
Thursday: Closed
Friday: 6 PM - 1 AM
Saturday: 9 AM - 11 AM, 4 PM - 11 PM
Sunday: Closed`
  );
});

describe("logical edge cases", () => {
  it("Reverse order close->open time should be valid, as long as time is increasing", () => {
    const result = parse({
      monday: [
        {
          type: "close",
          value: 37800,
        },
        {
          type: "open",
          value: 32400,
        },
      ],
    });

    expect(result).toEqual(
      `Monday: 9 AM - 10:30 AM
Tuesday: Closed
Wednesday: Closed
Thursday: Closed
Friday: Closed
Saturday: Closed
Sunday: Closed`
    );
  });

  it("Reverse order close->open, multiple values", () => {
    const result = parse({
      monday: [
        {
          type: "close",
          value: 4 * 60 * 60,
        },
        {
          type: "close",
          value: 2 * 60 * 60,
        },
        {
          type: "open",
          value: 1 * 60 * 60,
        },
        {
          type: "open",
          value: 3 * 60 * 60,
        },
      ],
    });

    expect(result).toEqual(
      `Monday: 1 AM - 2 AM, 3 AM - 4 AM
Tuesday: Closed
Wednesday: Closed
Thursday: Closed
Friday: Closed
Saturday: Closed
Sunday: Closed`
    );
  });

  it("duplicates are ignored", () => {
    const result = parse({
      monday: [
        {
          type: "close",
          value: 2 * 60 * 60,
        },
        {
          type: "open",
          value: 1 * 60 * 60,
        },
        {
          type: "open",
          value: 1 * 60 * 60,
        },
      ],
    });

    expect(result).toEqual(
      `Monday: 1 AM - 2 AM
Tuesday: Closed
Wednesday: Closed
Thursday: Closed
Friday: Closed
Saturday: Closed
Sunday: Closed`
    );
  });

  it("joining time", () => {
    const result = parse({
      monday: [
        {
          type: "open",
          value: 1 * 60 * 60,
        },
        {
          type: "close",
          value: 2 * 60 * 60,
        },
        {
          type: "open",
          value: 2 * 60 * 60,
        },
        {
          type: "close",
          value: 3 * 60 * 60,
        },
        {
          type: "open",
          value: 3 * 60 * 60,
        },
        {
          type: "close",
          value: 4 * 60 * 60,
        },
      ],
    });

    expect(result).toEqual(
      `Monday: 1 AM - 4 AM
Tuesday: Closed
Wednesday: Closed
Thursday: Closed
Friday: Closed
Saturday: Closed
Sunday: Closed`
    );
  });

  it("Seconds and border cases 00:00:01", () => {
    const result = parse({
      monday: [
        {
          type: "open",
          value: 1,
        },
        {
          type: "close",
          value: 86399,
        },
      ],
    });

    expect(result).toEqual(
      `Monday: 12:00:01 AM - 11:59:59 PM
Tuesday: Closed
Wednesday: Closed
Thursday: Closed
Friday: Closed
Saturday: Closed
Sunday: Closed`
    );
  });

  it("Week loop", () => {
    const result = parse({
      monday: [
        {
          type: "close",
          value: 10 * 60 * 60,
        },

        {
          type: "open",
          value: 18 * 60 * 60,
        },
        {
          type: "close",
          value: 19 * 60 * 60,
        },
      ],
      sunday: [
        {
          type: "open",
          value: 23 * 60 * 60,
        },
      ],
    });

    expect(result).toEqual(
      `Monday: 6 PM - 7 PM
Tuesday: Closed
Wednesday: Closed
Thursday: Closed
Friday: Closed
Saturday: Closed
Sunday: 11 PM - 10 AM`
    );
  });
});

describe("error cases", () => {
  const allClosed = `Monday: Closed
Tuesday: Closed
Wednesday: Closed
Thursday: Closed
Friday: Closed
Saturday: Closed
Sunday: Closed`;

  it("Empty object should return all days closed", () => {
    const result = parse({});
    expect(result).toEqual(
      `Monday: Closed
Tuesday: Closed
Wednesday: Closed
Thursday: Closed
Friday: Closed
Saturday: Closed
Sunday: Closed`
    );
  });

  it("Day without close time, should return all days closed", () => {
    const result = parse({
      monday: [
        {
          type: "open",
          value: 32400,
        },
      ],
    });

    expect(result).toEqual(allClosed);
  });

  it("Day without close time, should return all days closed", () => {
    const result = parse({
      monday: [
        {
          type: "open",
          value: 32400,
        },
      ],
    });
    expect(result).toEqual(allClosed);
  });

  it("Day without open time, should return all days closed", () => {
    const result = parse({
      monday: [
        {
          type: "close",
          value: 32400,
        },
      ],
    });
    expect(result).toEqual(allClosed);
  });

  it("Day with negative open time or overflow time returns all days closed", () => {
    const result = parse({
      monday: [
        {
          type: "open",
          value: -1000,
        },
        {
          type: "close",
          value: Number.MAX_VALUE,
        },
      ],
    });
    expect(result).toEqual(allClosed);
  });
});

describe("performance", () => {
  it("requirements full example should run in under 10 ms", () => {
    const [result, elapsedTimeMs] = measureTime(() =>
      parse({
        monday: [],
        tuesday: [
          {
            type: "open",
            value: 36000,
          },
          {
            type: "close",
            value: 64800,
          },
        ],
        wednesday: [],
        thursday: [
          {
            type: "open",
            value: 37800,
          },
          {
            type: "close",
            value: 64800,
          },
        ],
        friday: [
          {
            type: "open",
            value: 36000,
          },
        ],
        saturday: [
          {
            type: "close",
            value: 3600,
          },
          {
            type: "open",
            value: 36000,
          },
        ],
        sunday: [
          {
            type: "close",
            value: 3600,
          },
          {
            type: "open",
            value: 43200,
          },
          {
            type: "close",
            value: 75600,
          },
        ],
      })
    );

    expect(elapsedTimeMs).toBeLessThan(10);
    expect(result).toEqual(
      `Monday: Closed
Tuesday: 10 AM - 6 PM
Wednesday: Closed
Thursday: 10:30 AM - 6 PM
Friday: 10 AM - 1 AM
Saturday: 10 AM - 1 AM
Sunday: 12 PM - 9 PM`
    );
  });

  it("processes and returns a second-long ranges for entire week in under 2 sec", () => {
    const freakyDay: TimeRangePartial[] = [];

    for (let i = 0; i < 24 * 60 * 60; i = i + 2) {
      freakyDay.push({
        type: "open",
        value: i,
      });
      freakyDay.push({
        type: "close",
        value: i + 1,
      });
    }

    const [result, elapsedTimeMs] = measureTime(() =>
      parse({
        monday: freakyDay,
        tuesday: freakyDay,
        wednesday: freakyDay,
        thursday: freakyDay,
        friday: freakyDay,
        saturday: freakyDay,
        sunday: freakyDay,
      })
    );

    expect(elapsedTimeMs).toBeLessThan(2000);
    expect(result).toContain("Monday");
    expect(result).toContain("Sunday");
    expect(result).toContain("11:29:58 PM - 11:29:59 PM");
    expect(result.length).toBeGreaterThan(1000);
  });
});

function measureTime<T>(func: () => T): [T, number] {
  const startTime = performance.now();
  const result = func();
  const endTime = performance.now();
  const elapsedTime = endTime - startTime;

  return [result, elapsedTime];
}
