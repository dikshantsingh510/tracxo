import { expect, test } from "@playwright/test";
import { signUpAndVerify, uniqueEmail } from "./helpers/auth";
import { truncateAll } from "./helpers/db";

test.beforeEach(async () => {
  await truncateAll();
});

test("owner invites someone via link and they accept in a second browser context", async ({
  browser,
}) => {
  const ownerPage = await browser.newPage();
  const ownerEmail = uniqueEmail("owner");
  await signUpAndVerify(ownerPage, {
    name: "Owner",
    email: ownerEmail,
    password: "hunter22",
  });

  // Create a team workspace
  await ownerPage.getByRole("link", { name: /new workspace/i }).click();
  await ownerPage.getByLabel(/^name$/i).fill("Goa Trip");
  await ownerPage.getByRole("button", { name: /create workspace/i }).click();
  await ownerPage.waitForURL(/\/workspaces\/[a-f0-9-]+\/settings/);
  const workspaceId = ownerPage.url().match(/\/workspaces\/([a-f0-9-]+)\//)?.[1];
  expect(workspaceId).toBeTruthy();

  // Go to members and create an open invite
  await ownerPage.getByRole("link", { name: /manage members/i }).click();
  await ownerPage.getByLabel(/email/i).fill("");
  await ownerPage.getByRole("button", { name: /create invitation/i }).click();
  await expect(ownerPage.getByText(/invitation created/i)).toBeVisible();

  // Grab the invite link from the pending list "Copy link" button
  // by reading the invite token from the page (rendered in onclick handler is
  // not visible; grab from the network response). Easier: open the pending
  // invites and click "Copy link" — clipboard isn't readable in headless.
  // So: read token from DB directly.
  const { sql } = await import("./helpers/db");
  type Row = { token: string };
  const rows = (await sql.query(
    "SELECT token FROM invitations WHERE workspace_id = $1 ORDER BY created_at DESC LIMIT 1",
    [workspaceId as string],
  )) as Row[];
  const token = rows[0]?.token;
  expect(token).toBeTruthy();

  // Second browser context: sign up as joiner, open invite link, accept.
  const joinerContext = await browser.newContext();
  const joinerPage = await joinerContext.newPage();
  const joinerEmail = uniqueEmail("joiner");
  await signUpAndVerify(joinerPage, {
    name: "Joiner",
    email: joinerEmail,
    password: "hunter22",
  });
  await joinerPage.goto(`/invite/${token}`);
  await expect(joinerPage.getByText(/you've been invited/i)).toBeVisible();
  await joinerPage.getByRole("button", { name: /accept invitation/i }).click();

  // Lands on the workspace settings page
  await expect(joinerPage).toHaveURL(new RegExp(`/workspaces/${workspaceId}/settings`));
  await expect(joinerPage.getByText(/joined goa trip/i)).toBeVisible();

  // Owner refreshes members list and sees joiner present
  await ownerPage.reload();
  await expect(ownerPage.getByText(joinerEmail)).toBeVisible();
});

test("email-locked invite rejects redemption by a different email", async ({ browser }) => {
  const ownerPage = await browser.newPage();
  await signUpAndVerify(ownerPage, {
    name: "Lock",
    email: uniqueEmail("lock-owner"),
    password: "hunter22",
  });
  await ownerPage.getByRole("link", { name: /new workspace/i }).click();
  await ownerPage.getByLabel(/^name$/i).fill("Locked");
  await ownerPage.getByRole("button", { name: /create workspace/i }).click();
  await ownerPage.waitForURL(/\/workspaces\/[a-f0-9-]+\/settings/);
  const workspaceId = ownerPage.url().match(/\/workspaces\/([a-f0-9-]+)\//)?.[1];

  await ownerPage.getByRole("link", { name: /manage members/i }).click();
  await ownerPage.getByLabel(/email/i).fill("intended@x.test");
  await ownerPage.getByRole("button", { name: /create invitation/i }).click();
  await expect(ownerPage.getByText(/invitation created/i)).toBeVisible();

  const { sql } = await import("./helpers/db");
  const rows = (await sql.query(
    "SELECT token FROM invitations WHERE workspace_id = $1 ORDER BY created_at DESC LIMIT 1",
    [workspaceId as string],
  )) as Array<{ token: string }>;
  const token = rows[0].token;

  // Wrong-email signup tries to accept
  const wrongContext = await browser.newContext();
  const wrongPage = await wrongContext.newPage();
  await signUpAndVerify(wrongPage, {
    name: "Wrong",
    email: uniqueEmail("wrong"),
    password: "hunter22",
  });
  await wrongPage.goto(`/invite/${token}`);
  await wrongPage.getByRole("button", { name: /accept invitation/i }).click();

  // Toast or error message about wrong email
  await expect(wrongPage.getByText(/different email/i)).toBeVisible();
});
