import { SourceLocation } from "./types";

export type ErrorCode =
  | "E001"
  | "E002"
  | "E003"
  | "E004"
  | "E005"
  | "E006"
  | "E007"
  | "E008"
  | "E009"
  | "E010"
  | "E011"
  | "E012"
  | "E013"
  | "E014"
  | "E015"
  | "E016"
  | "E017"
  | "E018"
  | "E019"
  | "E020"
  | "E021"
  | "E022";

export interface ValidationError {
  code: ErrorCode;
  message: string;
  location: SourceLocation;
}

export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  E001: "Document must have a <slideshow> root element",
  E002: "slideshow element requires 'title' attribute",
  E003: "slideshow 'title' must not be empty",
  E004: "slideshow must contain at least one slide",
  E005: "slide element requires 'order' attribute",
  E006: "slide 'order' must be a positive integer",
  E007: "Duplicate slide order: {order}",
  E008: "Element with 'narration' requires 'order' attribute",
  E009: "Element requires 'order' because descendant has 'narration'",
  E010: "Duplicate order '{order}' among siblings",
  E011: "'order' must be a positive integer",
  E012: "'delay' must be a non-negative integer",
  E013: "Duplicate id: {id}",
  E014: "Unknown element: {element}",
  E015: "Element '{child}' not permitted inside '{parent}'",
  E016: "metadata element must appear before all slide elements",
  E017: "img element requires 'src' attribute",
  E018: "img element requires 'alt' attribute",
  E019: "Invalid transition: '{transition}'. Must be one of: none, fade, slide-left, slide-right, slide-up, slide-down",
  E020: "Unknown element in metadata: '{element}'",
  E021: "Duplicate metadata element: '{element}'",
  E022: "Invalid date format in '{element}'. Expected YYYY-MM-DD",
};

export function createError(
  code: ErrorCode,
  location: SourceLocation,
  params?: Record<string, string | number>
): ValidationError {
  let message = ERROR_MESSAGES[code];

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      message = message.replace(`{${key}}`, String(value));
    }
  }

  return { code, message, location };
}
