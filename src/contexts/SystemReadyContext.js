"use client";

import { createContext, useContext } from "react";
import { useSystemReady } from "@/hooks/useSystemReady";  // Importuojame mūsų custom hook'ą
import { toast } from "react-toastify";  // Toast pranešimams, jei klaida

// Sukuriame kontekstą SystemReady duomenims laikyti
const SystemReadyContext = createContext(null);

// SystemReadyProvider - tai komponentas, kuris tieks "SystemReady" duomenis visiems vaikiniams komponentams
export function SystemReadyProvider({ children }) {
  const systemReady = useSystemReady();  // Naudojame useSystemReady hook'ą, kad gautume pasiruošimo duomenis

  return (
    <SystemReadyContext.Provider value={systemReady}>
      {children}
    </SystemReadyContext.Provider>
  );
}

// useSystemReadyContext - tai hook'as, kuris leidžia komponentams pasiekti SystemReadyContext vertę
export function useSystemReadyContext() {
  const context = useContext(SystemReadyContext);

  // Tikriname, ar SystemReadyContext buvo teisingai užpildytas
  if (!context) {
    // Pridedame toast pranešimą klaidos atveju, kad būtų informuojami vartotojai
    toast.error("SystemReadyContext must be used within SystemReadyProvider.");
    
    console.error("useSystemReadyContext has been used outside of SystemReadyProvider.");
    throw new Error("useSystemReadyContext must be used within SystemReadyProvider");
  }

  // Grąžiname konteksto reikšmę, kurią gavome iš SystemReadyProvider
  return context;
}
