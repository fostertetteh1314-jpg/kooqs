import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function env(key: string) {
  return (process.env[key] ?? "").replace(/^﻿/, "").trim();
}

export async function POST(request: NextRequest) {
  try {
    const { amount, phone, externalRef, sessionId } = await request.json();

    if (!amount || !phone) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const cleanPhone = String(phone).replace(/\D/g, "");
    const ref = externalRef || `KOOQS_${Date.now()}`;

    const body: Record<string, unknown> = {
      type: 1,
      channel: "13",
      currency: "GHS",
      amount: Number(amount),
      payer: cleanPhone,
      externalref: ref,
      accountnumber: env("MOOLRE_ACCOUNT_NUMBER"),
    };

    if (sessionId) body.sessionid = String(sessionId).trim();

    const response = await fetch("https://api.moolre.com/open/transact/payment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-USER": env("MOOLRE_USER"),
        "X-API-KEY": env("MOOLRE_API_KEY"),
        "X-API-PUBKEY": env("MOOLRE_PUB_KEY"),
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json({ ...data, ref });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[Moolre] Payment error:", msg);
    return NextResponse.json({ error: "Payment initiation failed", detail: msg }, { status: 500 });
  }
}
