import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export function VerificationOtpEmail({ otp }: { otp: string }) {
  return (
    <Html>
      <Head />
      <Preview>Your Tracxo verification code: {otp}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Heading style={heading}>Verify your email</Heading>
          <Text style={paragraph}>
            Use the code below to confirm your email and finish signing up for Tracxo.
          </Text>
          <Section style={otpBox}>
            <Text style={otpText}>{otp}</Text>
          </Section>
          <Text style={muted}>
            This code expires in 10 minutes. If you didn&apos;t request it, you can safely ignore
            this email.
          </Text>
          <Hr style={hr} />
          <Text style={footer}>Tracxo — split smarter</Text>
        </Container>
      </Body>
    </Html>
  );
}

const body = {
  background: "#f8fafc",
  margin: 0,
  padding: "32px 0",
  fontFamily: "ui-sans-serif, system-ui, sans-serif",
} as const;
const container = {
  background: "#ffffff",
  maxWidth: "480px",
  margin: "0 auto",
  padding: "32px",
  borderRadius: "12px",
} as const;
const heading = { color: "#0f172a", fontSize: "22px", margin: "0 0 12px" } as const;
const paragraph = {
  color: "#334155",
  fontSize: "15px",
  lineHeight: "1.5",
  margin: "0 0 20px",
} as const;
const otpBox = {
  background: "#ecfdf5",
  border: "1px solid #6ee7b7",
  borderRadius: "8px",
  padding: "16px",
  textAlign: "center" as const,
} as const;
const otpText = {
  color: "#047857",
  fontSize: "28px",
  letterSpacing: "8px",
  fontWeight: 600,
  margin: 0,
} as const;
const muted = { color: "#64748b", fontSize: "13px", marginTop: "20px" } as const;
const hr = { borderColor: "#e2e8f0", margin: "24px 0" } as const;
const footer = { color: "#94a3b8", fontSize: "12px" } as const;
