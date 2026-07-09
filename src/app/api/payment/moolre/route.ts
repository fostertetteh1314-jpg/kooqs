import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const MOOLRE_API = "https://api.moolre.com/open/transact";

function env(key: string) {
  return (process.env[key] ?? "").replace(/^﻿/, "").trim();
}

// action: "initiate" (send payment request / OTP), "verify" (submit otpcode), "status" (check payment)
export async function POST(request: NextRequest) {
  try {
    const { action, amount, phone, channel, externalRef, otpCode } = await request.json();

    if (action === "status") {
      if (!externalRef) {
        return NextResponse.json({ error: "Missing externalRef" }, { status: 400 });
      }
      const response = await fetch(`${MOOLRE_API}/status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-USER": env("MOOLRE_USER"),
          "X-API-PUBKEY": env("MOOLRE_PUB_KEY"),
        },
        body: JSON.stringify({
          type: 1,
          idtype: 1,
          id: externalRef,
          accountnumber: env("MOOLRE_ACCOUNT_NUMBER"),
        }),
      });
      const data = await response.json();
      return NextResponse.json(data);
    }

    if (!amount || !phone || !externalRef) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const cleanPhone = String(phone).replace(/\D/g, "");

    const body: Record<string, unknown> = {
      type: 1,
      channel: String(channel || "13"),
      currency: "GHS",
      amount: String(amount),
      payer: cleanPhone,
      externalref: externalRef,
      accountnumber: env("MOOLRE_ACCOUNT_NUMBER"),
    };

    if (action === "verify" && otpCode) {
      body.otpcode = String(otpCode).trim();
    }

    const response = await fetch(`${MOOLRE_API}/payment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-USER": env("MOOLRE_USER"),
        "X-API-KEY": env("MOOLRE_PRIVATE_KEY"),
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[Moolre] Payment error:", msg);
    return NextResponse.json({ error: "Payment request failed", detail: msg }, { status: 500 });
  }
}
