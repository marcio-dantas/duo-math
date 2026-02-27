"use client";

/**
 * Contexto global de configurações do jogo.
 *
 * Provê acesso reativo às configurações de voz e de jogo
 * para todos os componentes filhos.
 * Persiste automaticamente em localStorage a cada alteração.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { VoiceSettings, GameSettings } from "@/lib/settings";
import {
  DEFAULT_VOICE_SETTINGS,
  loadVoiceSettings,
  saveVoiceSettings,
  DEFAULT_GAME_SETTINGS,
  loadGameSettings,
  saveGameSettings,
} from "@/lib/settings";

interface SettingsContextValue {
  voice: VoiceSettings;
  updateVoice: (patch: Partial<VoiceSettings>) => void;
  game: GameSettings;
  updateGame: (patch: Partial<GameSettings>) => void;
}

const SettingsContext = createContext<SettingsContextValue>({
  voice: DEFAULT_VOICE_SETTINGS,
  updateVoice: () => {},
  game: DEFAULT_GAME_SETTINGS,
  updateGame: () => {},
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [voice, setVoice] = useState<VoiceSettings>(DEFAULT_VOICE_SETTINGS);
  const [game, setGame] = useState<GameSettings>(DEFAULT_GAME_SETTINGS);

  /* Carrega do localStorage na montagem (client-side only) */
  useEffect(() => {
    setVoice(loadVoiceSettings());
    setGame(loadGameSettings());
  }, []);

  const updateVoice = useCallback((patch: Partial<VoiceSettings>) => {
    setVoice((prev) => {
      const next = { ...prev, ...patch };
      saveVoiceSettings(next);
      return next;
    });
  }, []);

  const updateGame = useCallback((patch: Partial<GameSettings>) => {
    setGame((prev) => {
      const next = { ...prev, ...patch };
      saveGameSettings(next);
      return next;
    });
  }, []);

  return (
    <SettingsContext.Provider value={{ voice, updateVoice, game, updateGame }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
