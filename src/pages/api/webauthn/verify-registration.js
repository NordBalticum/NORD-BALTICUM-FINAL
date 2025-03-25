import { verifyRegistrationResponse } from '@simplewebauthn/server';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(req) {
  const { email, attestationResponse } = await req.json();

  const { data, error } = await supabase
    .from("webauthn_credentials")
    .select("challenge")
    .eq("email", email)
    .single();

  if (error || !data) return NextResponse.json({ verified: false });

  try {
    const verification = await verifyRegistrationResponse({
      response: attestationResponse,
      expectedChallenge: data.challenge,
      expectedOrigin: process.env.NEXT_PUBLIC_WEBAUTHN_ORIGIN,
      expectedRPID: process.env.NEXT_PUBLIC_WEBAUTHN_RPID,
    });

    if (verification.verified) {
      const { credentialID, credentialPublicKey, counter } = verification.registrationInfo;

      await supabase
        .from("webauthn_credentials")
        .upsert({
          email,
          credential_id: Buffer.from(credentialID).toString("base64url"),
          public_key: Buffer.from(credentialPublicKey).toString("base64url"),
          counter,
          transports: attestationResponse.response.transports || [],
        });

      return NextResponse.json({ verified: true });
    }

    return NextResponse.json({ verified: false });
  } catch (err) {
    console.error("❌ Registration verify error:", err);
    return NextResponse.json({ verified: false });
  }
}
