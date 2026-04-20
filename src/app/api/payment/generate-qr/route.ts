import { NextRequest, NextResponse } from "next/server";
import { VNPay, ProductCode, VnpLocale, dateFormat, ignoreLogger, HashAlgorithm } from "vnpay";

const vnpay = new VNPay({
    tmnCode: process.env.VNPAY_TMN_CODE!,
    secureSecret: process.env.VNPAY_SECURE_SECRET!,
    vnpayHost: process.env.VNPAY_HOST ?? "https://sandbox.vnpayment.vn",
    testMode: true,
    hashAlgorithm: HashAlgorithm.SHA512,
    enableLog: false,
    loggerFn: ignoreLogger,
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { amount, orderInfo, txnRef } = body as {
            amount: number;
            orderInfo: string;
            txnRef: string;
        };

        if (!amount || !orderInfo || !txnRef) {
            return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
        }

        const ip =
            req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
            req.headers.get("x-real-ip") ??
            "127.0.0.1";

        const now = new Date();
        const expire = new Date(now.getTime() + 15 * 60 * 1000);

        const result = await vnpay.generateQr({
            vnp_Amount: amount,
            vnp_IpAddr: ip,
            vnp_TxnRef: txnRef,
            vnp_OrderInfo: orderInfo,
            vnp_OrderType: ProductCode.Other,
            vnp_ReturnUrl:
                `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/payment/result`,
            vnp_Locale: VnpLocale.VN,
            vnp_CreateDate: dateFormat(now),
            vnp_ExpireDate: dateFormat(expire),
        });

        return NextResponse.json(result);
    } catch (err) {
        console.error("[generate-qr]", err);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
