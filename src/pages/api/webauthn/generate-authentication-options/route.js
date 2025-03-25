import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(req) {
  const { email } = await req.json();

  const { data: credential, error } = await supabase
    .from("webauthn_credentials")
    .select("credential_id")
    .eq("email", email)
    .single();

  if (error || !credential) return NextResponse.json({ error: "Credential not found" }, { status: 404 });

  const options = generateAuthenticationOptions({
    timeout: 60000,
    rpID: process.env.NEXT_PUBLIC_WEBAUTHN_RPID,
    allowCredentials: [
      {
        id: Buffer.from(credential.credential_id, "base64url"),
        type: "public-key",
        transports: ["internal", "usb", "nfc", "ble"],
      },
    ],
    userVerification: "preferred",
  });

  await supabase
    .from("webauthn_credentials")
    .update({ challenge: options.challenge })
    .eq("email", email);

  return NextResponse.json(options);
}
