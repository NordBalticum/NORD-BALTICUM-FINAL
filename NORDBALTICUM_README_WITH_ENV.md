🚀 NordBalticum Web3 Bank – Official Update Guide (2025)

Sveikas, CEO!
Tai tavo geležinė atmintinė kaip profesionaliai tvarkyti ir auginti NordBalticum projektą.
Tikslas: 100% saugumas. 0% klaidų. 24/7 uptime.


---

🛠️ Įrankiai

🛡️ GitHub Pro → Kodo versijų valdymas

🚀 Vercel Pro → Hostingas + automatinis deploy

🛢️ Supabase Pro → Web3 duomenų bazė + autentifikacija

⛓️ Ethers.js → Blockchain/Web3 operacijos


✅ Viskas online – be bash terminalų, be local serverių!



---

📋 Tobulas Atnaujinimo Procesas

1. 🌱 Naujas Branch

GitHub ➔ Create New Branch ➔ feature/xxx arba hotfix/xxx

NIEKADA nerašyk tiesiai į main!



---

2. 🛠️ Kodo Pakeitimai

Dirbk tik naujame branch.

🚫 NE testuok su npm run dev!

✅ Testuok tik per Vercel Preview!



---

3. ✅ Sukurk Pull Request (PR)

Sukuri PR iš savo branch ➔ į main.

⚠️ NE Merge iškart! Pirmiausia ➔ Pilnas testavimas per Vercel Preview.



---

4. 🚀 Testuok per Vercel Preview

Kai PR sukurtas ➔ automatiškai bus sukurta Vercel Preview versija.

Eik į:
🌐 https://your-branch-name.vercel.app


✅ Testuok viską kaip vartotojas:

🔒 Prisijungimą

💰 Balanso užkrovimą

🔁 Kripto siuntimą

🔗 Tinklo perjungimą

💤 Minimalizuok tabą ➔ Grįžk ➔ Testuok sesijos atstatymą



---

5. 🛡️ Supabase Database Backup

Prieš Merge:

Supabase ➔ Database ➔ Backups ➔ Manual Backup ➔ Download SQL.


✅ Privalomas atsarginės kopijos žingsnis.


---

6. 🔄 Merge PR į main

Merge PR ➔ Vercel automatiškai deploy'ins į Production.


✅ Jokio rankinio deploy.


---

7. 🧹 Supabase Migracijos

Jei keiti DB struktūrą:

Sukurk SQL migracijos failą.

Paleisk migraciją tik per Supabase SQL Editor.


⚡ NIEKADA nekeisk tiesiogiai duomenų!


---

🌎 Google OAuth Setup

2x Google projektai:

🏦 NordBalticum Production

🧪 NordBalticum Development


Skirtingi:

🔑 Client ID

🔐 Client Secret

🌍 Redirect URL



✅ 100% atskirta Develop/Production aplinka.


---

📅 Savaitinis Saugumo Planas

Kas savaitę:

📥 Atsisiųsk Supabase Database Backup (.sql failą)

📥 Atsisiųsk Vercel Project Export (project zip)

📥 Atsisiųsk GitHub Source Code (zip)


✅ Laikyk atsargines kopijas saugiai.


---

🛡️ 2x DB Sistema

✅ Skirtingi Project ID + Skirtingi API raktai.


---

🛡️ Incident Response Plan

1. 🚨 Jei sistema neveikia:

Patikrink Vercel Status ➔ https://vercel.statuspage.io/

Patikrink Supabase Status ➔ https://status.supabase.com/


✅ Jei viskas OK ➔ eik į GitHub ➔ Rollback į paskutinį stabilų commit.


---

2. 🔥 Skubus Hotfix:

Sukuri hotfix/fix-issue-name

PR ➔ Preview ➔ Test ➔ Merge.


✅ Sistema lieka saugi.


---

3. 🧯 Jei DB pažeista:

Atkurk iš atsarginės kopijos .sql ➔ per Supabase SQL Editor.


✅ Privaloma visada turėti backup.


---

💎 Geležinės Taisyklės

🔄 Auto Session Refresh ➔ kas 5 minutes.

👀 Debounce + Visibility/Online Events ➔ jei tabas užsidaro ar tinklas krenta.

💰 BalanceCheck + Network Validation ➔ Web3 saugumas kaip MetaMask.

🚀 SafeSend + Fee Protection ➔ transakcijos 100% bulletproof.



---

🏦 Finalinė Žinutė

> NordBalticum = Decentralizuotas Web3 Bankas.
Ne projektas. Ne startup. Bankas.



✅ Paruošta 1M+ vartotojų.
✅ Saugu kaip MetaMask.
✅ Stipru kaip Coinbase.


---

🛡️ Priminta 100%

❌ NE testuok su npm run dev

✅ Testuok per Vercel Preview

✅ Merge tik po pilno testavimo!



---

🚀 NordBalticum – The Future is Ours.

💎🚀👑

---

---

# 🏦 Nord Balticum – Web3 Banking Layer (Final Edition)

> Ultra-stable crypto wallet built to outperform MetaMask – featuring secure fallback RPC, AES-GCM private key decryption, native + ERC20 transfers, dynamic gas calculation, admin-split logic, and full CI/CD test automation.

---

## 🚀 Tech Stack

- **Framework**: Next.js 15
- **Blockchain**: ethers.js v6
- **Auth**: MagicLink (email login)
- **Backend**: Supabase (PostgreSQL + Auth)
- **UI**: Radix UI + Framer Motion + Lucide Icons
- **Security**: AES-GCM key decryption on client
- **Testing**: Vitest (mock + live RPC support)
- **Deployment**: Vercel (auto test on build)

---

## ⚙️ Developer Onboarding

```bash
git clone https://github.com/your-org/nord-balticum-final.git
cd nord-balticum-final
npm install
cp .env.example .env
# fill all keys/secrets
npm run dev
```

---

## ✅ Automated Testing Suite

📁 File: `src/tests/SendContext.test.js`  
✅ 100% coverage of:
- MetaMask-grade utils: nonce, gas buffer, dropped TX, retries
- ERC20 + native transaction mocks
- Real testnet RPC live test (Goerli, Sepolia, etc.)
- Full tx.hash + status validation with `tx.wait()`

🧪 Test script (with email):
```bash
npm run test:send
```

Runs `runSendTests.js` → executes all tests and emails result to `ADMIN_EMAIL`.

---

## 🔁 Vercel Build & CI

### 🔨 Vercel Build Command
Paste this into **Vercel › Settings › Build & Development Settings › Build Command**:

```bash
npm run test:send && next build
```

### 🧩 vercel.json

```json
{
  "build": {
    "env": {
      "NODE_ENV": "production"
    }
  },
  "headers": [
    {
      "source": "/(.*).css",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "no-store"
        }
      ]
    }
  ]
}
```

---

## 🔐 Security Features

- ✅ AES-GCM private key decryption with salt + 100k PBKDF2
- ✅ Fallback GAS reserve per-chain (30+ supported)
- ✅ Automatic `gasLimit * 1.1n` like MetaMask
- ✅ `tx.wait()` confirmation
- ✅ Exponential retry with timeout handling
- ✅ Admin fee split with separate nonce

---

## 🩺 Monitoring & Reliability

- 📬 `runSendTests.js` sends result via email (nodemailer)
- 🧠 Supabase logs all TX errors, drops, replaces
- 🔒 Production safety enforced via tests on deploy
- 📈 Coverage report generated to `./coverage`

---

## 📊 Folder Structure

```
src/
├── contexts/           # SendContext.js (main logic)
├── scripts/            # runSendTests.js
├── tests/              # SendContext.test.js, setupVitest.js
├── utils/              # getProviderForChain, fallbackRPCs, walletHelper
```

---

## 🧬 Required .env Setup

```dotenv
# Supabase
SUPABASE_URL=https://your.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-svc-role-key

# Admin wallet + encryption
NEXT_PUBLIC_ADMIN_WALLET=0x000000000000000000000000000000000000dead
NEXT_PUBLIC_ENCRYPTION_SECRET=testtesttesttest1234567890

# Email alerts
ADMIN_EMAIL=admin@nordbalticum.io
EMAIL_FROM=your@gmail.com
EMAIL_PASS=your_gmail_app_password

# Live TX test config
TEST_PRIVATE_KEY=your_goerli_private_key
TEST_RECEIVER=0xreceiver_wallet
TEST_RPC_URL=https://rpc-goerli.example.com

# Optional
COINGECKO_API_KEY=your_key
```

---

## 📤 Production Checklist

- ✅ Auto test run on every Vercel deploy
- ✅ Transaction logging to Supabase (success/failure)
- ✅ Email alerts for test results
- ✅ 100% SSR-safe
- ✅ Native + ERC20 token support
- ✅ Dynamic fees + chain-specific reserves

---

## 🧾 Investor Tech Snippets

- "Nord Balticum is a **MetaMask-grade wallet infrastructure** with live network testing on deploy, AES-encrypted private key handling, and admin revenue splitting – across 30+ chains."
- "Each transaction goes through nonce control, dropped TX detection, and gas estimation buffering – **identical to MetaMask/Phantom logic**."
- "Live tests are executed automatically on production deploy and the result is emailed to the admin, ensuring **zero regression risk**."
- "The system includes real ERC20 support, live pricing (CoinGecko), full context separation, and fallback RPC logic for maximum reliability."

---

🏁 *This is a production-grade, self-healing, MetaMask-level crypto wallet layer for 2025 Web3 environments – secure, auditable, tested, and scalable.*

---

### 🧪 `.env.example` Configuration

```
# === 🔐 ENVIRONMENT CONFIGURATION (example) ===

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# AES-GCM Encryption
NEXT_PUBLIC_ENCRYPTION_SECRET=testtesttesttest1234567890

# Admin Wallet (ETH address)
NEXT_PUBLIC_ADMIN_WALLET=0x000000000000000000000000000000000000dead

# Email Notification Setup
ADMIN_EMAIL=admin@nordbalticum.io
EMAIL_PASS=your-gmail-app-password
EMAIL_FROM=nordbalticum@gmail.com

# Optional - for LIVE test in SendContext.test.js
TEST_PRIVATE_KEY=your_test_private_key
TEST_RPC_URL=https://rpc.testnet.example
TEST_RECEIVER=0xreceiverwalletaddress
```