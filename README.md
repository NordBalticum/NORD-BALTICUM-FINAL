# 🚀 NordBalticum Web3 Bank – Official Update Guide (2025)

Sveikas, CEO!  
Čia tavo **geležinė atmintinė**, kaip profesionaliai atnaujinti **NordBalticum** projektą.  
**Mūsų taisyklė:** 100% saugumas. 0% klaidų. 24/7 uptime.

---

## 🛠️ Įrankiai, kuriuos naudojam

- **GitHub Pro** → kodo valdymas
- **Vercel Pro** → hostingas + automatinis deploy
- **Supabase Pro** → Web3 duomenų bazė + autentifikacija
- **Ethers.js** → decentralizuotos blockchain operacijos

✅ Viskas online – be terminalų, be bash, be vietinio kompiuterio.

---

## 📋 Tobulas Atnaujinimo Procesas

### 1. 🌱 Sukurk naują Branch

**NIEKADA** nerašyk tiesiai į `main`!

- GitHub ➔ Branch ➔ `Create new branch from main`
- Pavadinimas pvz.:  
  `update/fix-login` arba `feature/new-dashboard`

---

### 2. 🛠️ Kodo pakeitimai

- Padaryk pakeitimus naujame **branch**.
- **Lokalus npm run dev = nebereikalingas.**  
  Viską matysi tiesiai Vercel Preview!

---

### 3. ✅ Sukurk Pull Request (PR)

- Atidaryk PR GitHub'e iš savo branch ➔ į `main`.
- **NE Merge iškart!**

---

### 4. 🚀 Testuok per Vercel Preview

**Svarbiausia žingsnis!**

- Kai sukursi PR, GitHub ir Vercel sukurs **Preview Deploy**.
- Eik į:  
  **https://your-branch-name.vercel.app**

✅ Testuok kaip tikras naudotojas:

- Prisijungimas
- Balanso užkrovimas
- Kripto siuntimas
- Tinklo perjungimas
- Minimizuok tabą ➔ Grįžk ➔ Testuok sesiją

**✅ Viską testuojam per Vercel Preview – ne lokaliai!**

---

### 5. 🛡️ Supabase Duomenų Bazės Backup

Prieš merge:

- Supabase ➔ Database ➔ Backups ➔ **Manual Backup** ➔ Download SQL.

**Backup privalomas prieš bet kokį atnaujinimą!**

---

### 6. 🔄 Merge PR į `main`

Kai Preview pilnai veikia:

- GitHub ➔ **Merge Pull Request** į `main`.

✅ Vercel automatiškai atnaujins live versiją.  
✅ Jokio deploy spaudinėjimo. Viskas autokontrolėje.

---

### 7. 🧹 Supabase Migracijos (jei reikia)

Jei keiti duomenų bazės struktūrą:

- Sukurk SQL migration script.
- Paleisk **tik** per Supabase SQL Editor.

⚡ **NIEKADA** nerašyk SQL rankomis per live DB!

---

## ⚡ Greitas Hotfix (jei skubi)

- Jei reikia pataisyti mažą klaidą:
  - Sukuri `hotfix/fix-balance-page`.
  - Padarai PR ➔ Preview ➔ Test ➔ Merge.

✅ Sistema lieka saugi 100%.

---

## 💎 Geležinės Taisyklės

- **Auto Session Refresh** ➔ 5 min intervalas – viskas gyva.
- **Debounce + Visibility/Online Events** ➔ jei tabas užsidaro ar internetas krenta, automatinis atstatymas.
- **BalanceCheck + Network Validation** ➔ Web3 saugumas kaip MetaMask.
- **SafeSend + Fee Protection** ➔ siuntimas bulletproof.

---

# 🏦 Pabaiga

> **NordBalticum = Web3 Bankas.  
> Ne projektas. Ne startuolis. Bankas.**

✅ Visos operacijos kaip MetaMask + TrustWallet.  
✅ Saugumas kaip Coinbase.

---

# 🛡️ 100% PRIMINTA:

- ❌ **NE testuok su `npm run dev`.**
- ✅ **VISADA testuok per Vercel Preview!**
- ✅ **Tik po testavimo – Merge į main.**

---

# 🚀 NordBalticum – The Future is Ours.
