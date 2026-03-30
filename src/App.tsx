import { useScreenStore } from './store/screenStore';
import { HomeScreen } from './screens/HomeScreen';
import { QuickPlaySelectScreen } from './screens/QuickPlaySelectScreen';
import { GameScreen } from './screens/GameScreen';
import { ResultScreen } from './screens/ResultScreen';
import { FranchiseSetupScreen } from './screens/FranchiseSetupScreen';
import { FranchiseHubScreen } from './screens/FranchiseHubScreen';
import { FranchiseResultScreen } from './screens/FranchiseResultScreen';

export default function App() {
  const currentScreen = useScreenStore((s) => s.currentScreen);

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      {currentScreen === 'home' && <HomeScreen />}
      {currentScreen === 'quickPlaySelect' && <QuickPlaySelectScreen />}
      {currentScreen === 'game' && <GameScreen />}
      {currentScreen === 'result' && <ResultScreen />}
      {currentScreen === 'franchiseSetup' && <FranchiseSetupScreen />}
      {currentScreen === 'franchiseHub' && <FranchiseHubScreen />}
      {currentScreen === 'franchiseResult' && <FranchiseResultScreen />}
    </div>
  );
}
