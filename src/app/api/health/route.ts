import { NextResponse } from "next/server";

export async function GET() {
  const checks: Record<string, unknown> = {};
  
  // 1. Check env vars (masked)
  checks.DATABASE_URL = process.env.DATABASE_URL 
    ? `${process.env.DATABASE_URL.substring(0, 20)}...` 
    : "NOT SET";
  checks.TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN 
    ? `${process.env.TURSO_AUTH_TOKEN.substring(0, 10)}...` 
    : "NOT SET";
  checks.AUTH_SECRET = process.env.AUTH_SECRET ? "SET" : "NOT SET";
  checks.NODE_ENV = process.env.NODE_ENV;

  // 2. Test Prisma / DB connection
  try {
    const { prisma } = await import("@/lib/prisma");
    const count = await prisma.user.count();
    checks.db_connection = "OK";
    checks.user_count = count;
  } catch (e: unknown) {
    const err = e as Error;
    checks.db_connection = "FAILED";
    checks.db_error = err.message?.substring(0, 300);
  }

  // 3. Test auth
  try {
    const { auth } = await import("@/lib/auth");
    const session = await auth();
    checks.auth = session ? "authenticated" : "no session";
  } catch (e: unknown) {
    const err = e as Error;
    checks.auth = "ERROR";
    checks.auth_error = err.message?.substring(0, 200);
  }

  return NextResponse.json(checks, { status: 200 });
}
