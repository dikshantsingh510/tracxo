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

export function WorkspaceInviteEmail({
  workspaceName,
  inviteUrl,
  role,
}: {
  workspaceName: string;
  inviteUrl: string;
  role: "admin" | "member";
}) {
  return (
    <Html>
      <Head />
      <Preview>You&apos;ve been invited to {workspaceName} on Tracxo</Preview>
      <Body style={body}>
        <Container style={container}>
          <Heading style={heading}>You&apos;re invited</Heading>
          <Text style={paragraph}>
            You&apos;ve been invited to join <strong>{workspaceName}</strong> on Tracxo as a{" "}
            <strong>{role}</strong>.
          </Text>
          <Section style={{ textAlign: "center" }}>
            <Button href={inviteUrl} style={button}>
              Accept invitation
            </Button>
          </Section>
          <Text style={muted}>
            The link expires in 7 days. If you don&apos;t want to join, you can ignore this email.
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
