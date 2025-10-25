import { handler } from "../../lambda/handlers/workingDays";
import type { APIGatewayProxyEvent } from "aws-lambda";

jest.mock("../../lambda/utils/holiday", () => ({
  fetchHolidays: jest
    .fn()
    .mockResolvedValue(new Set<string>(["2025-04-17", "2025-04-18"])),
  isHoliday: (date: Date, holidays: Set<string>): boolean => {
    const dateStr = date.toISOString().split("T")[0];
    return holidays.has(dateStr);
  },
}));

function makeEvent(query: Record<string, string> = {}): APIGatewayProxyEvent {
  return {
    resource: "/working-days",
    path: "/working-days",
    httpMethod: "GET",
    headers: {},
    multiValueHeaders: {},
    queryStringParameters: Object.keys(query).length ? (query as any) : null,
    multiValueQueryStringParameters: null,
    pathParameters: null,
    stageVariables: null,
    requestContext: {} as any,
    body: null,
    isBase64Encoded: false,
  };
}

describe("workingDays handler (integration)", () => {
  test("error si no envía days ni hours", async () => {
    const res = await handler(makeEvent());
    expect(res.statusCode).toBe(400);
    expect(res.headers?.["Content-Type"]).toContain("application/json");
    const body = JSON.parse(res.body);
    expect(body.error).toBe("InvalidParameters");
  });

  test("OK con days y hours", async () => {
    const res = await handler(
      makeEvent({
        date: "2025-04-10T15:00:00.000Z",
        days: "5",
        hours: "4",
      })
    );
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body).toHaveProperty("date", "2025-04-21T20:00:00.000Z");
  });
});
