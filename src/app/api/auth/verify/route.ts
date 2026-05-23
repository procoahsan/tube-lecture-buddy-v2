import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req: NextRequest) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json(
        { error: "Email and verification code (OTP) are required" },
        { status: 400 }
      );
    }

    await connectDB();

    const lowerEmail = email.toLowerCase().trim();

    // Fetch user with otp and otpExpiry fields selected
    const user = await User.findOne({ email: lowerEmail }).select("+otp +otpExpiry");

    if (!user) {
      return NextResponse.json(
        { error: "No account found with this email" },
        { status: 404 }
      );
    }

    if (user.isVerified) {
      return NextResponse.json(
        { message: "Account is already verified" },
        { status: 200 }
      );
    }

    if (!user.otp || !user.otpExpiry) {
      return NextResponse.json(
        { error: "No active verification code found. Please request a new one." },
        { status: 400 }
      );
    }

    // Verify OTP expiry
    if (new Date() > user.otpExpiry) {
      return NextResponse.json(
        { error: "Verification code has expired. Please sign up again to receive a new code." },
        { status: 400 }
      );
    }

    // Verify OTP code match
    if (user.otp !== otp.trim()) {
      return NextResponse.json(
        { error: "Invalid verification code. Please check the code and try again." },
        { status: 400 }
      );
    }

    // Successfully verified
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    return NextResponse.json(
      {
        message: "Email verified successfully! You can now log in.",
        verified: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
