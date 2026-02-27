import GameScreen from "@/components/GameScreen";
import { SettingsProvider } from "@/contexts/SettingsContext";

export default function Home() {
  return (
    <SettingsProvider>
      <main className="h-full w-full">
        <GameScreen />
      </main>
    </SettingsProvider>
  );
}
