import { NextResponse } from "next/server";
import { db } from "@/db";
import { applications } from "../../../../drizzle/schema";

export async function POST(request: Request) {
  const body = await request.json();

  const required = [
    "companyName",
    "ceoName",
    "managerName",
    "ceoPhone",
    "managerPhone",
    "businessModel",
    "ceoCardPath",
    "managerCardPath",
    "irDeckPath",
  ] as const;

  for (const field of required) {
    if (typeof body[field] !== "string" || !body[field].trim()) {
      return NextResponse.json(
        { error: `${field} is required` },
        { status: 400 }
      );
    }
  }

  const [row] = await db
    .insert(applications)
    .values({
      companyName: body.companyName,
      ceoName: body.ceoName,
      managerName: body.managerName,
      ceoPhone: body.ceoPhone,
      managerPhone: body.managerPhone,
      businessModel: body.businessModel,
      ceoCardPath: body.ceoCardPath,
      managerCardPath: body.managerCardPath,
      irDeckPath: body.irDeckPath,
    })
    .returning({ id: applications.id });

  return NextResponse.json({ id: row.id }, { status: 201 });
}
