/**
 * Utility to safely stringify any error or exception value into a readable string.
 */
export function stringifyError(err: unknown): string {
  if (!err) return "Unknown Error";
  if (typeof err === "string") return err;
  if (err instanceof Error) return err.message;
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

/**
 * Safely parses JSON from AI responses that might contain markdown, preamble, or text noise.
 */
export function safeJsonParse<T = unknown>(content: string, context = "AI response"): T {
  if (!content || typeof content !== "string") {
    throw new Error(`Invalid content provided to parse for ${context}.`);
  }

  // 1. Try direct parse after basic trim
  const trimmed = content.trim();
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    // Continue to extract JSON block
  }

  // 2. Extract markdown code block if present
  const codeBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (codeBlockMatch && codeBlockMatch[1]) {
    try {
      return JSON.parse(codeBlockMatch[1].trim()) as T;
    } catch {
      // Continue to bracket matching
    }
  }

  // 3. Extract outermost object { ... } or array [ ... ]
  const firstCurly = trimmed.indexOf('{');
  const lastCurly = trimmed.lastIndexOf('}');
  const firstSquare = trimmed.indexOf('[');
  const lastSquare = trimmed.lastIndexOf(']');

  // Determine if object or array is outer
  let candidate = "";
  if (firstCurly !== -1 && lastCurly > firstCurly && (firstSquare === -1 || firstCurly < firstSquare)) {
    candidate = trimmed.substring(firstCurly, lastCurly + 1);
  } else if (firstSquare !== -1 && lastSquare > firstSquare) {
    candidate = trimmed.substring(firstSquare, lastSquare + 1);
  }

  if (candidate) {
    try {
      return JSON.parse(candidate) as T;
    } catch {
      // Failed candidate
    }
  }

  throw new Error(`Invalid JSON response from AI while processing ${context}.`);
}

/**
 * Strips markdown code blocks, quotes, and extraneous whitespace from AI text responses.
 */
export function cleanResult(content: string): string {
  if (!content) return "";
  return content
    .replace(/^```[a-z]*\n/gi, "")
    .replace(/```$/g, "")
    .trim()
    .replace(/^"+|"+$/g, ""); // Strip leading/trailing double quotes
}

/**
 * Promise-based delay helper.
 */
export const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));
