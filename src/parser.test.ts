import { FastifyBaseLogger } from "fastify";
import parse from "./parser";

const logger = {
  error: jest.fn()
} as unknown as FastifyBaseLogger;

it("Simple monday 9-10:30", () => {
  const result = parse(JSON.stringify({
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
  }), logger);

  expect(result).toEqual(
`Monday: 9 AM - 10:30 AM
Tuesday: Closed
Wednesday: Closed
Thursday: Closed
Friday: Closed
Saturday: Closed
Sunday: Closed`
  )
});


// it("Simple monday 9-10:30, 11-20", () => {
//   const result = parse(JSON.stringify({
//     monday: [
//       {
//         type: "open",
//         value: 32400,
//       },
//       {
//         type: "close",
//         value: 37800,
//       },
//       {
//         type: "open",
//         value: 39600,
//       },
//       {
//         type: "close",
//         value: 72000,
//       },
//     ],
//   }), logger);

//   expect(result).toEqual(
// `Monday: 9 AM - 10:30 AM, 11 AM - 8 PM
// Tuesday: Closed
// Wednesday: Closed
// Thursday: Closed
// Friday: Closed
// Saturday: Closed
// Sunday: Closed`
//   )
// });


describe('edge cases', ()=>{
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
    )
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
    )
  });

  it("Reverse order close->open time should be valid, as long as time is increasing", () => {
    const result = parse(JSON.stringify({
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
    }), logger);
  
    expect(result).toEqual(
`Monday: 9 AM - 10:30 AM
Tuesday: Closed
Wednesday: Closed
Thursday: Closed
Friday: Closed
Saturday: Closed
Sunday: Closed`
    )
  });
  
  it("Seconds and border cases 00:00:01", () => {
    const result = parse(JSON.stringify({
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
    }), logger);
  
    expect(result).toEqual(
`Monday: 12:00:01 AM - 11:59:59 PM
Tuesday: Closed
Wednesday: Closed
Thursday: Closed
Friday: Closed
Saturday: Closed
Sunday: Closed`
    )
  });
});

