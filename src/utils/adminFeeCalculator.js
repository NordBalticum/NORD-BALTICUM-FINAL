"use client";

// ✅ Funkcija paskaičiuoti 3% administracinį mokestį
export function calculateAdminFee(amount) {
  if (typeof amount !== "number" || isNaN(amount)) {
    throw new Error("Amount must be a valid number.");
  }
  return amount * 0.03;
}
