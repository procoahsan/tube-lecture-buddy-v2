import * as React from "react";
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface OTPTemplateProps {
  name: string;
  otp: string;
  logoSrc?: string;
}

const baseUrl =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.NEXTAUTH_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export const OTPTemplate = ({
  name = "Learner",
  otp = "123456",
  logoSrc = `${baseUrl}/logo.png`,
}: OTPTemplateProps) => {
  return (
    <Html>
      <Head />
      <Preview>Your Tube Lecture Buddy Verification Code</Preview>
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
          <Heading style={h1}>Verify your email address</Heading>
          <Text style={heroText}>
            Hi {name},
          </Text>
          <Text style={text}>
            Thank you for registering with Tube Lecture Buddy! To complete your signup and start transforming YouTube lectures into premium study materials, please verify your email using the 6-digit verification code below:
          </Text>
          <Section style={codeContainer}>
            <Text style={code}>{otp}</Text>
          </Section>
          <Text style={subtext}>
            This verification code is valid for 10 minutes. If you did not request this verification, please ignore this email or contact support if you have concerns.
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

export default OTPTemplate;

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

const codeContainer = {
  background: "rgba(108, 92, 231, 0.1)",
  borderRadius: "8px",
  border: "1px dashed #6c5ce7",
  margin: "24px 0",
  padding: "12px",
  textAlign: "center" as const,
};

const code = {
  color: "#6c5ce7",
  fontSize: "36px",
  fontWeight: "bold" as const,
  letterSpacing: "8px",
  margin: "0",
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
