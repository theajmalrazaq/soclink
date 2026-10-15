import { NextRequest, NextResponse } from "next/server";
import { authorizeApiRequest } from "@/lib/server/apiAuth";

export async function GET(req: NextRequest) {
  const access = await authorizeApiRequest(req);
  if (access instanceof NextResponse) return access;

  const account = access.account!;
  return NextResponse.json({
    user: {
      id: account.id,
      userId: account.user_id,
      name: account.name,
      email: account.email,
      role: account.role,
      permissions: account.permissions,
    },
  });
}
