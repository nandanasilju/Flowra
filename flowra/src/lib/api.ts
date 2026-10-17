/** Route-handler helpers: consistent JSON errors, zod handling, no body logging. */
import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function json<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

type Handler = (req: NextRequest) => Promise<Response>;

export function handle(fn: Handler): Handler {
  return async (req) => {
    try {
      return await fn(req);
    } catch (err) {
      if (err instanceof HttpError) return json({ error: err.message }, err.status);
      if (err instanceof ZodError) {
        return json(
          { error: "Please check the highlighted fields.", issues: err.issues.map((i) => ({ path: i.path.join("."), message: i.message })) },
          400,
        );
      }
      // Log only the error message: never request bodies, transcripts or audio.
      console.error(`[api] ${req.method} ${req.nextUrl.pathname}:`, err instanceof Error ? err.message : "unknown error");
      return json({ error: "Something went wrong. Please try again." }, 500);
    }
  };
}

export async function readJson(req: NextRequest): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    throw new HttpError(400, "Invalid JSON body");
  }
}
