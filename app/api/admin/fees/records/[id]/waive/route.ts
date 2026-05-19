import { NextResponse } from "next/server";

export async function PATCH() {
	return NextResponse.json({ success: false, message: "Not implemented" }, { status: 501 });
}

