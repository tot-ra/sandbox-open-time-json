import axios from "axios";

describe("POST http://localhost:1234/availability", () => {
  it("should return 200 http status", async () => {
    const response = await axios.post("http://localhost:1234/availability", {
      monday: [
        {
          type: "open",
          value: 32400,
        },
        {
          type: "close",
          value: 72000,
        },
      ],
    });
    expect(response.status).toEqual(200);
  });
});
