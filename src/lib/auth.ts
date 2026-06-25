import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

const localhostAuthUrl = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/i;

if (process.env.NODE_ENV === "production") {
  for (const key of ["AUTH_URL", "NEXTAUTH_URL"] as const) {
    const value = process.env[key];
    if (value && localhostAuthUrl.test(value)) {
      delete process.env[key];
    }
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        await connectDB();

        const user = await User.findOne({ email: credentials.email }).select("+password +isVerified");
        if (!user) {
          throw new Error("No account found with this email");
        }

        if (!user.password) {
          throw new Error("This account uses Google sign-in. Please sign in with Google.");
        }

        // Enforce OTP Email Verification for credentials login
        if (user.isVerified === false) {
          throw new Error("unverified");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );
        if (!isPasswordValid) {
          throw new Error("Incorrect password");
        }

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        await connectDB();

        // Check if user already exists
        const existingUser = await User.findOne({ email: user.email });

        if (!existingUser) {
          // Create new user from Google data (Google users are pre-verified)
          await User.create({
            name: user.name,
            email: user.email,
            image: user.image,
            provider: "google",
            isVerified: true,
          });
        } else {
          // Ensure they are marked verified since they signed in with Google
          let changed = false;
          if (existingUser.isVerified === false) {
            existingUser.isVerified = true;
            changed = true;
          }
          if (existingUser.provider === "credentials" && !existingUser.image && user.image) {
            existingUser.image = user.image;
            changed = true;
          }
          if (changed) {
            await existingUser.save();
          }
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  trustHost: true,
});
