import { generateRegistrationOptions } from '@simplewebauthn/server';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(req) {
  const { email } = await req.json();

  const options = generateRegistrationOptions({
    rpName: 'NordBalticum',
    rpID: process.env.NEXT_PUBLIC_WEBAUTHN_RPID || 'localhost',
    userID: email,
    userName: email,
    attestationType: 'none',
    authenticatorSelection: {
      userVerification: 'preferred',
      residentKey: 'preferred',
    },
    timeout: 60000,
  });

  await supabase
    .from("webauthn_credentials")
    .upsert({ email, challenge: options.challenge });

  return NextResponse.json(options);
}
