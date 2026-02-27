"use client";

/**
 * Contexto global de configurações do jogo.
 *
 * Provê acesso reativo às configurações de voz (e futuras
 * categorias de #14) para todos os componentes filhos.
 * Persiste automaticamente em localStorage a cada alteração.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { VoiceSettings } from "@/lib/settings";
import {
  DEFAULT_VOICE_SETTINGS,
  loadVoiceSettings,
  saveVoiceSettings,
} from "@/lib/settings";

interface SettingsContextValue {
  voice: VoiceSettings;
  updateVoice: (patch: Partial<VoiceSettings>) => void;
}

const SettingsContext = createContext<SettingsContextValue>({
  voice: DEFAULT_VOICE_SETTINGS,
  updateVoice: () => {},
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [voice, setVoice] = useState<VoiceSettings>(DEFAULT_VOICE_SETTINGS);

  /* Carrega do localStorage na montagem (client-side only) */
  useEffect(() => {
    setVoice(loadVoiceSettings());
  }, []);

  const updateVoice = useCallback((patch: Partial<VoiceSettings>) => {
    setVoice((prev) => {
      const next = { ...prev, ...patch };
      saveVoiceSettings(next);
      return next;
    });
  }, []);

  return (
    <SettingsContext.Provider value={{ voice, updateVoice }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
