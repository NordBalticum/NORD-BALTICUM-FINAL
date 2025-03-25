import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(req) {
  const { email, authenticationResponse } = await req.json();

  const { data, error } = await supabase
    .from("webauthn_credentials")
    .select("*")
    .eq("email", email)
    .single();

  if (error || !data) return NextResponse.json({ verified: false });

  try {
    const verification = await verifyAuthenticationResponse({
      response: authenticationResponse,
      expectedChallenge: data.challenge,
      expectedOrigin: process.env.NEXT_PUBLIC_WEBAUTHN_ORIGIN,
      expectedRPID: process.env.NEXT_PUBLIC_WEBAUTHN_RPID,
      authenticator: {
        credentialID: Buffer.from(data.credential_id, "base64url"),
        credentialPublicKey: Buffer.from(data.public_key, "base64url"),
        counter: data.counter,
      },
    });

    if (verification.verified) {
      await supabase
        .from("webauthn_credentials")
        .update({ counter: verification.authenticationInfo.newCounter })
        .eq("email", email);
    }

    return NextResponse.json({ verified: verification.verified });
  } catch (err) {
    console.error("❌ Authentication verify error:", err);
    return NextResponse.json({ verified: false });
  }
}
