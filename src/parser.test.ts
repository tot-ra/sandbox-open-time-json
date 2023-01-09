import { FastifyBaseLogger } from "fastify";
import parse from "./parser";

const logger = {
  error: jest.fn(),
} as unknown as FastifyBaseLogger;

it("Simple monday 9-10:30", () => {
  const result = parse(
    JSON.stringify({
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
    }),
    logger
  );

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
  const result = parse(
    JSON.stringify({
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
    }),
    logger
  );

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
  const result = parse(
    JSON.stringify({
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
    }),
    logger
  );

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

it("requirements full example", () => {
  const result = parse(
    JSON.stringify({
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
    }),
    logger
  );

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

describe("logical edge cases", () => {
  it("Reverse order close->open time should be valid, as long as time is increasing", () => {
    const result = parse(
      JSON.stringify({
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
      }),
      logger
    );

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
    const result = parse(
      JSON.stringify({
        monday: [
          {
            type: "close",
            value: 4*60*60,
          },
          {
            type: "close",
            value: 2*60*60,
          },
          {
            type: "open",
            value: 1*60*60,
          },
          {
            type: "open",
            value: 3*60*60,
          },
        ],
      }),
      logger
    );

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

  it("Seconds and border cases 00:00:01", () => {
    const result = parse(
      JSON.stringify({
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
      }),
      logger
    );

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

  it('Week loop',()=>{
    const result = parse(
      JSON.stringify({
        monday: [
          {
            type: "close",
            value: 10*60*60,
          },


          {
            type: "open",
            value: 18*60*60,
          },
          {
            type: "close",
            value: 19*60*60,
          },
        ],
        sunday: [
          {
            type: "open",
            value: 23*60*60,
          },
        ]
      }),
      logger
    );
  
    expect(result).toEqual(
    `Monday: 6 PM - 7 PM
Tuesday: Closed
Wednesday: Closed
Thursday: Closed
Friday: Closed
Saturday: Closed
Sunday: 11 PM - 10 AM`
  );
  })
});

describe("error cases", () => {
  it("Invalid JSON should return all days closed", () => {
    const result = parse("{", logger);

    expect(logger.error).toHaveBeenCalled();
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

  it("Empty string should return all days closed", () => {
    const result = parse("", logger);

    expect(logger.error).toHaveBeenCalled();
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

  it("Empty object should return all days closed", () => {
    const result = parse(JSON.stringify({}), logger);
    expect(logger.error).not.toHaveBeenCalled();

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
});