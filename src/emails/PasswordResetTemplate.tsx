import * as React from "react";
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface PasswordResetTemplateProps {
  name: string;
  resetUrl: string;
  logoSrc?: string;
}

const baseUrl =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.NEXTAUTH_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export const PasswordResetTemplate = ({
  name = "Learner",
  resetUrl = "http://localhost:3000/reset-password?token=abc",
  logoSrc = `${baseUrl}/logo.png`,
}: PasswordResetTemplateProps) => {
  return (
    <Html>
      <Head />
      <Preview>Reset your Tube Lecture Buddy password</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoContainer}>
            <Img
              src={logoSrc}
              width="80"
              height="80"
              alt="Tube Lecture Buddy"
              style={logo}
            />
          </Section>
          <Heading style={brandName}>Tube Lecture Buddy</Heading>
          <Heading style={h1}>Reset your password</Heading>
          <Text style={heroText}>
            Hi {name},
          </Text>
          <Text style={text}>
            We received a request to reset the password for your Tube Lecture Buddy account. Click the button below to choose a new password:
          </Text>
          <Section style={buttonContainer}>
            <Link href={resetUrl} style={button}>
              🔑 Reset Password
            </Link>
          </Section>
          <Text style={text}>
            Or copy and paste this link into your browser:
          </Text>
          <Text style={linkText}>
            {resetUrl}
          </Text>
          <Text style={subtext}>
            This password reset link is valid for 30 minutes. If you did not request a password reset, please ignore this email — your account is safe.
          </Text>
          <Section style={footer}>
            <Text style={footerText}>
              📚 Tube Lecture Buddy — AI-Powered Study Buddy
            </Text>
            <Text style={footerSubtext}>
              Built with ❤️ for learners everywhere.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default PasswordResetTemplate;

// Styles
const main = {
  backgroundColor: "#0d0e15",
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
  padding: "40px 0",
};

const container = {
  margin: "0 auto",
  padding: "40px 20px",
  width: "560px",
  backgroundColor: "#151622",
  borderRadius: "16px",
  border: "1px solid #232438",
};

const logoContainer = {
  textAlign: "center" as const,
  marginBottom: "8px",
};

const logo = {
  borderRadius: "50%",
  border: "3px solid #6c5ce7",
  margin: "0 auto",
  boxShadow: "0 0 24px rgba(108,92,231,0.4)",
};

const brandName = {
  color: "#a29bfe",
  fontSize: "14px",
  fontWeight: "600" as const,
  textAlign: "center" as const,
  margin: "0 0 24px",
  letterSpacing: "1px",
  textTransform: "uppercase" as const,
};

const h1 = {
  color: "#ffffff",
  fontSize: "24px",
  fontWeight: "bold" as const,
  textAlign: "center" as const,
  margin: "30px 0",
};

const heroText = {
  color: "#c2c3d6",
  fontSize: "16px",
  lineHeight: "26px",
  fontWeight: "bold" as const,
};

const text = {
  color: "#a2a3bd",
  fontSize: "14px",
  lineHeight: "24px",
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "28px 0",
};

const button = {
  backgroundColor: "#6c5ce7",
  borderRadius: "9999px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "bold" as const,
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "14px 40px",
  boxShadow: "0 4px 20px rgba(108,92,231,0.4)",
};

const linkText = {
  color: "#6c5ce7",
  fontSize: "12px",
  lineHeight: "18px",
  wordBreak: "break-all" as const,
  margin: "0 0 20px",
};

const subtext = {
  color: "#72738d",
  fontSize: "12px",
  lineHeight: "18px",
  marginTop: "20px",
};

const footer = {
  borderTop: "1px solid #232438",
  marginTop: "40px",
  paddingTop: "20px",
  textAlign: "center" as const,
};

const footerText = {
  color: "#a2a3bd",
  fontSize: "14px",
  fontWeight: "bold" as const,
  margin: "0",
};

const footerSubtext = {
  color: "#72738d",
  fontSize: "12px",
  margin: "4px 0 0",
};
