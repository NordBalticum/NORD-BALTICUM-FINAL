# 🚀 NordBalticum Project Update Guide (2025)

Sveikas, CEO!  
Čia tavo **oficialus atnaujinimo vadovas**, kad projektas veiktų kaip **geležinis bankas**.  
**Tikslas:** 100% saugumas. 0% klaidų. 24/7 stabilumas.

---

## 🛠️ Įrankiai

- **GitHub Pro** → kodo versijų valdymas
- **Vercel Pro** → hostingas ir deploy
- **Supabase Pro** → duomenų bazė ir autentifikacija
- **Ethers.js** → blockchain/Web3 operacijos

---

## 📋 Tobulas Atnaujinimo Procesas

### 1. 🔥 Sukurk naują Branch

**NIEKADA** nedirbk tiesiai ant `main`!

```bash
git checkout -b update/feature-name
```

---

### 2. 🛠️ Padaryk pakeitimus

- Daryk kodų pakeitimus naujame **branch**.
- **NE testuok lokaliai** (`npm run dev` tinka tik pažiūrėti vizualiai).

---

### 3. ✅ Pateik PR (Pull Request)

- Kai baigei – padaryk **Pull Request** į `main`.
- **NE Merge** PR iškart!

---

### 4. 🚀 Testuok Vercel Preview

**LABAI SVARBU**:  
Visada tikrink per **Vercel Preview** URL!

- GitHub sukurs **preview versiją** automatiškai.
- Eik į preview linką (pvz. https://update-branch-name.vercel.app).
- Pilnai testuok:
  - Prisijungimą
  - Balansus
  - Siuntimą
  - Sesijos stabilumą (minimalizuok tabą, atgal įeik)

**✅ Testuojame kaip tikras naudotojas, ne kaip programuotojas!**

---

### 5. 🛡️ Supabase DB Backup

Prieš deploy:

- Eik į **Supabase** ➔ **Database** ➔ **Backups** ➔ **Manual Backup** ➔ **Download SQL**.

**Privaloma!**

---

### 6. 🔄 Merge PR į `main`

Kai Vercel Preview veikia:

- Spaudi **Merge Pull Request** į `main`.
- **Vercel automatiškai atnaujins live svetainę**.

✅ Jokio rankinio deploy.

---

### 7. 🧹 Supabase Migracijos (jei reikia)

Jei darai DB pakeitimus:

- Sukurk **migration SQL script**.
- Paleisk **tik per Supabase SQL editor**.

⚠️ **NIEKADA** nekeisk tiesiogiai duomenų "gyvai"!

---

## ⚡ BONUS: Skubus Hotfix

- Skubus pataisymas = darai `hotfix/` branch.
- Toks pat procesas: PR ➔ Preview ➔ Test ➔ Merge.

---

## 💎 Auksinės Taisyklės

- **Auto session refresh** → kas 5 min automatinis atnaujinimas.
- **Debounce + Visibility/Online Events** → jei tabas užsidaro ar tinklas dingsta, viskas stabilu.
- **Balance + Network Validation** → Web3 saugumas kaip MetaMask.
- **SafeSend + FeeCheck** → transakcijos 100% bulletproof.

---

# 🏦 Finalinė Žinutė

> **NordBalticum = Geležinis Crypto Bankas.**

**Būk kaip CEO. Veik kaip bankas. Uptime 24/7.**

🚀 **NordBalticum – The Future is Ours.**

---

# 🛡️ 100% Priminta

- ❌ **NE testuok lokaliai.**  
- ✅ **VISADA testuok per Vercel Preview!**
- ✅ **Tik tada merge.**

---
