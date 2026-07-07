const SMS_ENDPOINT = "https://api.moolre.com/open/sms/send";

export async function sendSMS(recipient: string, message: string, ref?: string) {
  const vasKey = process.env.MOOLRE_VAS_KEY;
  if (!vasKey) {
    console.warn("[SMS] MOOLRE_VAS_KEY not set — skipping SMS");
    return;
  }

  const cleanPhone = recipient.replace(/\D/g, "");

  const body = {
    type: 1,
    senderid: process.env.MOOLRE_SENDER_ID ?? "",
    messages: [
      {
        recipient: cleanPhone,
        message,
        ref: ref ?? `SMS_${Date.now()}`,
      },
    ],
  };

  const response = await fetch(SMS_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-VASKEY": vasKey,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  if (!response.ok || data.status === 0) {
    console.error("[SMS] Send failed:", data);
  }
  return data;
}

export function buildOrderConfirmationSMS(params: {
  customerName: string;
  orderNumber: string;
  total: number;
  orderType: string;
  estimatedTime?: number | null;
  phone: string;
}) {
  const { customerName, orderNumber, total, orderType, estimatedTime } = params;
  const firstName = customerName.split(" ")[0];
  const eta = estimatedTime ? `~${estimatedTime} mins` : "soon";
  const typeText = orderType === "delivery" ? "delivery" : "pickup";

  return (
    `Hi ${firstName}! Your Kooqs Takeout order #${orderNumber} (GHS ${total.toFixed(2)}) ` +
    `is confirmed for ${typeText}. Ready in ${eta}. ` +
    `Questions? Call 055 090 7888. Thank you!`
  );
}
