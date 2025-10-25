export interface QueryParameters {
  days?: string;
  hours?: string;
  date?: string;
}

export interface SuccessResponse {
  date: string;
}

export interface ErrorResponse {
  error: string;
  message: string;
}

export interface Holiday {
  holiday: string;
  celebrationDate: string;
}

export interface HolidaysData {
  data: Holiday[];
}

export type HolidaysSet = Set<string>;
