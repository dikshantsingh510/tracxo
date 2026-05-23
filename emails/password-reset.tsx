import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export function PasswordResetEmail({ resetUrl }: { resetUrl: string }) {
  return (
    <Html>
      <Head />
      <Preview>Reset your Tracxo password</Preview>
      <Body style={body}>
        <Container style={container}>
          <Heading style={heading}>Reset your password</Heading>
          <Text style={paragraph}>
            Click the button below to set a new password. The link expires in 1 hour.
          </Text>
          <Section style={{ textAlign: "center" }}>
            <Button href={resetUrl} style={button}>
              Reset password
            </Button>
          </Section>
          <Text style={muted}>
            If you didn&apos;t request this, ignore the email and your password will stay the same.
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
const button = {
  background: "#059669",
  color: "#ffffff",
  padding: "12px 24px",
  borderRadius: "8px",
  textDecoration: "none",
  fontWeight: 600,
} as const;
const muted = { color: "#64748b", fontSize: "13px", marginTop: "20px" } as const;
const hr = { borderColor: "#e2e8f0", margin: "24px 0" } as const;
const footer = { color: "#94a3b8", fontSize: "12px" } as const;
