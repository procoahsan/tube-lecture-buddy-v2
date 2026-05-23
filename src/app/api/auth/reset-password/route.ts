import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: "Reset token and new password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    await connectDB();

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // First, find user by token (without expiry check) to give better error messages
    const user = await User.findOne({
      passwordResetToken: hashedToken,
    }).select("+passwordResetToken +passwordResetExpiry +password");

    if (!user) {
      console.log("[Reset Password] No user found with this token hash:", hashedToken.substring(0, 12) + "...");
      return NextResponse.json(
        { error: "This reset link is invalid. Please request a new password reset." },
        { status: 400 }
      );
    }

    // Check expiry separately for a clearer error message
    if (!user.passwordResetExpiry || user.passwordResetExpiry < new Date()) {
      console.log("[Reset Password] Token expired for user:", user.email, "Expiry:", user.passwordResetExpiry);
      // Clear the expired token
      user.passwordResetToken = undefined;
      user.passwordResetExpiry = undefined;
      await user.save();
      return NextResponse.json(
        { error: "This reset link has expired. Please request a new password reset." },
        { status: 400 }
      );
    }

    user.password = await bcrypt.hash(password, 12);
    user.passwordResetToken = undefined;
    user.passwordResetExpiry = undefined;
    user.isVerified = true;
    await user.save();

    console.log("[Reset Password] Password reset successfully for:", user.email);

    return NextResponse.json(
      { message: "Password reset successfully. Please sign in with your new password." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
