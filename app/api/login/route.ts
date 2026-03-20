import { NextResponse } from "next/server";
import { USERS } from "@/lib/auth";

export async function POST(req: Request) {
  const { username, password } = await req.json();

  const user = USERS.find(
    (u) => u.username === username && u.password === password
  );

  if (!user) {
    return NextResponse.json({ message: "error" }, { status: 401 });
  }

  const res = NextResponse.json({ success: true });

  res.cookies.set("auth", "true", {
    httpOnly: true,
    path: "/", // 🔥 маш чухал
  });

  return res;
}