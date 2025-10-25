import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { QueryParameters, SuccessResponse, ErrorResponse } from "../types";
import { fetchHolidays } from "../utils/holiday";
import { calculateWorkingDate } from "../services/dateCalculator";

function createResponse(
  statusCode: number,
  body: SuccessResponse | ErrorResponse
): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
    body: JSON.stringify(body),
  };
}

function validateAndParseParameters(queryParams: QueryParameters | null): {
  days: number;
  hours: number;
  startDate: Date | null;
  error?: ErrorResponse;
} {
  if (!queryParams) {
    return {
      days: 0,
      hours: 0,
      startDate: null,
      error: {
        error: "InvalidParameters",
        message: "No query parameters provided",
      },
    };
  }

  const { days, hours, date } = queryParams;

  if (!days && !hours) {
    return {
      days: 0,
      hours: 0,
      startDate: null,
      error: {
        error: "InvalidParameters",
        message: 'At least one of "days" or "hours" must be provided',
      },
    };
  }

  let parsedDays = 0;
  let parsedHours = 0;
  let parsedDate: Date | null = null;

  if (days) {
    parsedDays = parseInt(days, 10);
    if (isNaN(parsedDays) || parsedDays < 0) {
      return {
        days: 0,
        hours: 0,
        startDate: null,
        error: {
          error: "InvalidParameters",
          message: '"days" must be a positive integer',
        },
      };
    }
  }

  if (hours) {
    parsedHours = parseInt(hours, 10);
    if (isNaN(parsedHours) || parsedHours < 0) {
      return {
        days: 0,
        hours: 0,
        startDate: null,
        error: {
          error: "InvalidParameters",
          message: '"hours" must be a positive integer',
        },
      };
    }
  }

  if (date) {
    if (!date.endsWith("Z")) {
      return {
        days: 0,
        hours: 0,
        startDate: null,
        error: {
          error: "InvalidParameters",
          message: '"date" must be in UTC format with Z suffix (ISO 8601)',
        },
      };
    }

    parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return {
        days: 0,
        hours: 0,
        startDate: null,
        error: {
          error: "InvalidParameters",
          message: '"date" must be a valid ISO 8601 date',
        },
      };
    }
  }

  return {
    days: parsedDays,
    hours: parsedHours,
    startDate: parsedDate,
  };
}

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  console.log("Incoming event:", JSON.stringify(event));

  try {
    const queryParams = event.queryStringParameters as QueryParameters | null;
    const { days, hours, startDate, error } =
      validateAndParseParameters(queryParams);

    if (error) {
      console.warn("Validation error:", error);
      return createResponse(400, error);
    }

    console.log("Fetching holidays data...");
    const holidays = await fetchHolidays();
    console.log(
      "Fetched holidays:",
      Array.isArray(holidays) ? holidays.length : "unknown",
      "records"
    );

    console.log("Calculating working date with:", {
      startDate,
      days,
      hours,
    });

    const resultDate = calculateWorkingDate(startDate, days, hours, holidays);

    console.log("Result date calculated:", resultDate.toISOString());

    const response: SuccessResponse = {
      date: resultDate.toISOString(),
    };

    return createResponse(200, response);
  } catch (error: any) {
    console.error("Error processing request:", {
      name: error?.name,
      message: error?.message,
      cause: error?.cause ?? null,
      stack: error?.stack?.split("\n").slice(0, 3),
    });

    const errorResponse: ErrorResponse = {
      error: "InternalServerError",
      message:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };

    return createResponse(503, errorResponse);
  }
}
