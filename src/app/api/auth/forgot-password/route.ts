import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    await connectDB();

    const lowerEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: lowerEmail });

    // Keep the response generic so account existence cannot be probed.
    const genericResponse = {
      message: "If an account exists for that email, a password reset link has been sent.",
    };

    if (!user || user.provider === "google" || !user.isVerified) {
      return NextResponse.json(genericResponse, { status: 200 });
    }

    // Generate a raw random token (this goes in the URL)
    const token = crypto.randomBytes(32).toString("hex");
    // Hash it for secure DB storage (we never store the raw token)
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    user.passwordResetToken = hashedToken;
    user.passwordResetExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    await user.save();

    // Verify the save worked by re-reading
    const checkUser = await User.findOne({ email: lowerEmail }).select("+passwordResetToken +passwordResetExpiry");
    console.log("[Forgot Password] Token saved successfully:", !!checkUser?.passwordResetToken);
    console.log("[Forgot Password] Token expiry:", checkUser?.passwordResetExpiry);

    const emailResult = await sendPasswordResetEmail(lowerEmail, user.name, token);

    return NextResponse.json(
      {
        ...genericResponse,
        simulated: emailResult.simulated,
        resetUrl: emailResult.simulated ? emailResult.resetUrl : undefined,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
