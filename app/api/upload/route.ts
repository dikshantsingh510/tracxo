import { getSession } from "@/lib/auth/server";
import { ALLOWED_ATTACHMENT_MIME, MAX_ATTACHMENT_BYTES } from "@/lib/validation/attachment";
import { type HandleUploadBody, handleUpload } from "@vercel/blob/client";
import { NextResponse } from "next/server";

// Vercel Blob client-upload endpoint. Pattern:
//   1. Client calls `upload()` from @vercel/blob/client — that posts to this
//      route asking for a short-lived signed token.
//   2. We verify the session here. If OK, we hand back a token with size + MIME
//      constraints baked in (the SDK enforces them client-side too).
//   3. Client uploads the file directly to blob.vercel-storage.com — no bytes
//      flow through our server.
//   4. Client then calls `recordAttachment` Server Action with the resulting
//      blob URL + metadata so we can persist a DB row.
//
// We do not pin the upload to a particular expense at token time — checking
// expense membership happens when `recordAttachment` runs. Tokens are short
// lived, so the attack surface is "a logged-in user can upload one orphaned
// blob," which the Blob bill caps via the size/MIME guardrails.

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const json = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        const session = await getSession();
        if (!session) throw new Error("Unauthorized");
        return {
          allowedContentTypes: [...ALLOWED_ATTACHMENT_MIME],
          maximumSizeInBytes: MAX_ATTACHMENT_BYTES,
          tokenPayload: JSON.stringify({ userId: session.user.id }),
        };
      },
      onUploadCompleted: async () => {
        // No-op — the DB row is created by the client follow-up call.
      },
    });
    return NextResponse.json(json);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
