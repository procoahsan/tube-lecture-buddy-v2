import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { sendOTPEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    // Validate inputs
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    if (name.length < 2) {
      return NextResponse.json(
        { error: "Name must be at least 2 characters" },
        { status: 400 }
      );
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json(
        { error: "Please provide a valid email" },
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

    const lowerEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await User.findOne({ email: lowerEmail });
    if (existingUser) {
      if (existingUser.provider === "google") {
        return NextResponse.json(
          { error: "This email is registered with Google. Please sign in with Google." },
          { status: 409 }
        );
      }
      
      // If the existing user is already verified, block re-registration
      if (existingUser.isVerified) {
        return NextResponse.json(
          { error: "An account with this email already exists" },
          { status: 409 }
        );
      }
      
      // If the existing user is NOT verified, we can overwrite it with the new info and re-send OTP
      const hashedPassword = await bcrypt.hash(password, 12);
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

      existingUser.name = name.trim();
      existingUser.password = hashedPassword;
      existingUser.otp = otp;
      existingUser.otpExpiry = otpExpiry;
      await existingUser.save();

      // Send verification email
      const emailResult = await sendOTPEmail(lowerEmail, name.trim(), otp);

      return NextResponse.json(
        {
          message: "Verification code sent to your email",
          email: lowerEmail,
          simulated: emailResult.simulated,
          otp: emailResult.simulated ? otp : undefined, // Provide OTP only if simulated in terminal
        },
        { status: 200 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create unverified user
    const user = await User.create({
      name: name.trim(),
      email: lowerEmail,
      password: hashedPassword,
      provider: "credentials",
      isVerified: false,
      otp,
      otpExpiry,
    });

    // Send verification email
    const emailResult = await sendOTPEmail(lowerEmail, name.trim(), otp);

    return NextResponse.json(
      {
        message: "Verification code sent to your email",
        email: lowerEmail,
        simulated: emailResult.simulated,
        otp: emailResult.simulated ? otp : undefined, // Provide OTP only if simulated in terminal
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
