import axios from "axios";
import 'jest';

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

    console.log(response.data);
    expect(response.status).toEqual(200);
    expect(response.data).toEqual({
      
    });
  });
});