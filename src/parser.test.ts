import { FastifyBaseLogger } from "fastify";
import parse from "./parser";

describe('edge cases', ()=>{
  const logger = {
    error: jest.fn()
  } as unknown as FastifyBaseLogger;

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
});


// it("Simple one day", () => {
//   const result = parse(JSON.stringify({
//     monday: [
//       {
//         type: "open",
//         value: 32400,
//       },
//       {
//         type: "close",
//         value: 72000,
//       },
//     ],
//   }));

//   expect(result).toEqual("Mondays - 9 AM to 8 PM")
// });
