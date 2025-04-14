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

📁 Projekto Struktūra

📦 NORD-BALTICUM-FINAL
├── src/
│   ├── app/                 # Puslapiai (login, dashboard, send, receive, settings, transactions)
│   ├── components/          # Komponentai (LivePriceTable, MiniLoadingSpinner, WalletImport, ConfirmModal)
│   ├── contexts/            # Context Provideriai (AuthContext, BalanceContext, SendContext, NetworkContext)
│   ├── hooks/               # Hook'ai (useSystemReady, useMinimalReady, useDebounce)
│   ├── styles/              # CSS failai (global.css, theme.css, background.module.css, dashboard.module.css)
│   ├── utils/               # Helper funkcijos (supabaseClient, getGasPrice, encryption helpers)
│   └── assets/              # Paveikslėliai, ikonos, logotipai
├── public/                  # Vieši failai (favicon, icons)
├── .env.local               # Local aplinkos kintamieji
├── package.json             # Projekto priklausomybės
└── README.md                # Šitas failas


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
