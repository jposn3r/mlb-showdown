import { useState } from 'react';
import { useScreenStore } from '../store/screenStore';
import { useFranchiseStore } from '../store/franchiseStore';
import { teams, divisions } from '../data/teams';
import { motion, AnimatePresence } from 'framer-motion';
import type { Difficulty, SeasonLength } from '../types/franchise';

type Step = 1 | 2 | 3 | 4 | 5;

export function FranchiseSetupScreen() {
  const navigate = useScreenStore((s) => s.navigate);
  const createFranchise = useFranchiseStore((s) => s.createFranchise);

  const [step, setStep] = useState<Step>(1);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [seasonLength, setSeasonLength] = useState<SeasonLength>(30);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [franchiseName, setFranchiseName] = useState('');

  const selectedTeamMeta = selectedTeam ? teams.find(t => t.abbr === selectedTeam) : null;

  const goToStep = (s: Step) => setStep(s);

  const handleTeamSelect = (abbr: string) => {
    setSelectedTeam(abbr);
    const meta = teams.find(t => t.abbr === abbr);
    if (meta) {
      setFranchiseName(`${meta.name} Franchise`);
    }
  };

  const handleLaunch = () => {
    if (!selectedTeam) return;
    setStep(5);
    createFranchise({
      name: franchiseName,
      userTeamAbbr: selectedTeam,
      seasonLength,
      difficulty,
      startMode: 'preset',
    });
    // Transition to hub after animation
    setTimeout(() => navigate('franchiseHub'), 2500);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
      <AnimatePresence mode="wait">
        {step === 1 && (
          <StepWrapper key="step1">
            <h1
              className="text-3xl md:text-4xl font-bold mb-2 text-center"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--color-gold)' }}
            >
              Franchise Mode
            </h1>
            <p className="text-sm mb-8 text-center" style={{ color: 'var(--color-text-muted)' }}>
              Choose how to build your team
            </p>

            <div className="flex flex-col gap-4 w-full max-w-md">
              <button
                onClick={() => goToStep(2)}
                className="rounded-lg p-5 text-left transition-all hover:scale-[1.02] cursor-pointer"
                style={{
                  background: 'var(--color-bg-surface)',
                  border: '2px solid var(--color-gold)',
                }}
              >
                <h3 className="text-lg font-bold" style={{ color: 'var(--color-gold)', fontFamily: 'var(--font-display)' }}>
                  Pick a Team
                </h3>
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                  Choose any of 30 MLB teams with real rosters
                </p>
              </button>

              <button
                disabled
                className="rounded-lg p-5 text-left opacity-40 cursor-not-allowed"
                style={{
                  background: 'var(--color-bg-surface)',
                  border: '1px solid var(--color-divider)',
                }}
              >
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-display)' }}>
                    Pack Draft
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider"
                    style={{ background: 'var(--color-bg-elevated)', color: 'var(--color-text-muted)' }}>
                    Coming Soon
                  </span>
                </div>
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                  Open packs and draft your roster
                </p>
              </button>

              <button
                disabled
                className="rounded-lg p-5 text-left opacity-40 cursor-not-allowed"
                style={{
                  background: 'var(--color-bg-surface)',
                  border: '1px solid var(--color-divider)',
                }}
              >
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-display)' }}>
                    Team Builder
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider"
                    style={{ background: 'var(--color-bg-elevated)', color: 'var(--color-text-muted)' }}>
                    Coming Soon
                  </span>
                </div>
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                  Build a custom roster with a 5000 point budget
                </p>
              </button>
            </div>

            <button
              onClick={() => navigate('home')}
              className="mt-8 text-sm cursor-pointer transition-colors hover:text-[var(--color-gold)]"
              style={{ color: 'var(--color-text-muted)' }}
            >
              ← Back to Menu
            </button>
          </StepWrapper>
        )}

        {step === 2 && (
          <StepWrapper key="step2">
            <h2
              className="text-2xl font-bold mb-1 text-center"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--color-gold)' }}
            >
              Select Your Team
            </h2>
            <p className="text-xs mb-6 text-center" style={{ color: 'var(--color-text-muted)' }}>
              This is your franchise. Choose wisely.
            </p>

            {/* Division grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full max-w-3xl mb-6">
              {divisions.map(div => (
                <div key={div}>
                  <h4
                    className="text-[10px] uppercase tracking-wider font-bold mb-2 px-1"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    {div}
                  </h4>
                  <div className="flex flex-col gap-1">
                    {teams.filter(t => t.division === div).map(team => (
                      <button
                        key={team.abbr}
                        onClick={() => handleTeamSelect(team.abbr)}
                        className="flex items-center gap-2 px-3 py-2 rounded-md transition-all cursor-pointer hover:scale-[1.02]"
                        style={{
                          background: selectedTeam === team.abbr
                            ? team.primaryColor
                            : 'var(--color-bg-surface)',
                          border: selectedTeam === team.abbr
                            ? '2px solid var(--color-gold)'
                            : '1px solid var(--color-divider)',
                        }}
                      >
                        <img
                          src={team.logoUrl}
                          alt={team.name}
                          className="w-6 h-6"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                        <span
                          className="text-xs font-bold"
                          style={{
                            color: selectedTeam === team.abbr ? '#fff' : 'var(--color-text)',
                          }}
                        >
                          {team.abbr}
                        </span>
                        <span
                          className="text-xs hidden md:inline"
                          style={{
                            color: selectedTeam === team.abbr ? 'rgba(255,255,255,0.7)' : 'var(--color-text-muted)',
                          }}
                        >
                          {team.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => goToStep(1)}
                className="px-5 py-2 rounded-lg text-sm cursor-pointer transition-colors"
                style={{ background: 'var(--color-bg-surface)', color: 'var(--color-text-muted)', border: '1px solid var(--color-divider)' }}
              >
                Back
              </button>
              <button
                onClick={() => selectedTeam && goToStep(3)}
                disabled={!selectedTeam}
                className="px-6 py-2 rounded-lg text-sm font-bold cursor-pointer transition-all hover:scale-105 disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ background: 'var(--color-gold)', color: 'var(--color-bg)' }}
              >
                Next
              </button>
            </div>
          </StepWrapper>
        )}

        {step === 3 && (
          <StepWrapper key="step3">
            <h2
              className="text-2xl font-bold mb-6 text-center"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--color-gold)' }}
            >
              Season Settings
            </h2>

            {/* Season Length */}
            <div className="w-full max-w-md mb-8">
              <h3 className="text-xs uppercase tracking-wider font-bold mb-3" style={{ color: 'var(--color-text-muted)' }}>
                Season Length
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {([10, 30, 50] as SeasonLength[]).map(len => (
                  <button
                    key={len}
                    onClick={() => setSeasonLength(len)}
                    className="rounded-lg p-4 text-center transition-all cursor-pointer hover:scale-[1.03]"
                    style={{
                      background: seasonLength === len ? 'var(--color-gold)' : 'var(--color-bg-surface)',
                      color: seasonLength === len ? 'var(--color-bg)' : 'var(--color-text)',
                      border: seasonLength === len ? '2px solid var(--color-gold)' : '1px solid var(--color-divider)',
                    }}
                  >
                    <div className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>{len}</div>
                    <div className="text-[10px] mt-1">
                      {len === 10 ? 'Quick' : len === 30 ? 'Standard' : 'Full'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty */}
            <div className="w-full max-w-md mb-8">
              <h3 className="text-xs uppercase tracking-wider font-bold mb-3" style={{ color: 'var(--color-text-muted)' }}>
                CPU Difficulty
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {([
                  { id: 'easy' as Difficulty, label: 'Easy', desc: 'CPU plays passively' },
                  { id: 'medium' as Difficulty, label: 'Medium', desc: 'Balanced challenge' },
                  { id: 'hard' as Difficulty, label: 'Hard', desc: 'CPU plays optimally' },
                ]).map(d => (
                  <button
                    key={d.id}
                    onClick={() => setDifficulty(d.id)}
                    className="rounded-lg p-4 text-center transition-all cursor-pointer hover:scale-[1.03]"
                    style={{
                      background: difficulty === d.id ? 'var(--color-gold)' : 'var(--color-bg-surface)',
                      color: difficulty === d.id ? 'var(--color-bg)' : 'var(--color-text)',
                      border: difficulty === d.id ? '2px solid var(--color-gold)' : '1px solid var(--color-divider)',
                    }}
                  >
                    <div className="text-sm font-bold">{d.label}</div>
                    <div className="text-[10px] mt-1" style={{
                      color: difficulty === d.id ? 'var(--color-bg)' : 'var(--color-text-muted)',
                    }}>{d.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => goToStep(2)}
                className="px-5 py-2 rounded-lg text-sm cursor-pointer transition-colors"
                style={{ background: 'var(--color-bg-surface)', color: 'var(--color-text-muted)', border: '1px solid var(--color-divider)' }}
              >
                Back
              </button>
              <button
                onClick={() => goToStep(4)}
                className="px-6 py-2 rounded-lg text-sm font-bold cursor-pointer transition-all hover:scale-105"
                style={{ background: 'var(--color-gold)', color: 'var(--color-bg)' }}
              >
                Next
              </button>
            </div>
          </StepWrapper>
        )}

        {step === 4 && (
          <StepWrapper key="step4">
            <h2
              className="text-2xl font-bold mb-6 text-center"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--color-gold)' }}
            >
              Confirm Your Franchise
            </h2>

            {/* Name input */}
            <div className="w-full max-w-md mb-6">
              <label className="text-xs uppercase tracking-wider font-bold block mb-2" style={{ color: 'var(--color-text-muted)' }}>
                Franchise Name
              </label>
              <input
                type="text"
                value={franchiseName}
                onChange={(e) => setFranchiseName(e.target.value)}
                maxLength={40}
                className="w-full px-4 py-3 rounded-lg text-sm font-bold outline-none"
                style={{
                  background: 'var(--color-bg-surface)',
                  color: 'var(--color-text)',
                  border: '1px solid var(--color-divider)',
                  fontFamily: 'var(--font-display)',
                }}
              />
            </div>

            {/* Summary card */}
            {selectedTeamMeta && (
              <div
                className="w-full max-w-md rounded-lg p-5 mb-6"
                style={{
                  background: 'var(--color-bg-surface)',
                  borderLeft: `4px solid ${selectedTeamMeta.primaryColor}`,
                  border: '1px solid var(--color-divider)',
                  borderLeftWidth: '4px',
                  borderLeftColor: selectedTeamMeta.primaryColor,
                }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <img
                    src={selectedTeamMeta.logoUrl}
                    alt={selectedTeamMeta.name}
                    className="w-10 h-10"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                  <div>
                    <div className="font-bold text-lg" style={{ color: 'var(--color-text)', fontFamily: 'var(--font-display)' }}>
                      {selectedTeamMeta.name}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      {selectedTeamMeta.division}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span style={{ color: 'var(--color-text-muted)' }}>Season:</span>{' '}
                    <span className="font-bold">{seasonLength} games</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--color-text-muted)' }}>Difficulty:</span>{' '}
                    <span className="font-bold capitalize">{difficulty}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => goToStep(3)}
                className="px-5 py-2 rounded-lg text-sm cursor-pointer transition-colors"
                style={{ background: 'var(--color-bg-surface)', color: 'var(--color-text-muted)', border: '1px solid var(--color-divider)' }}
              >
                Back
              </button>
              <button
                onClick={handleLaunch}
                disabled={!franchiseName.trim()}
                className="px-8 py-3 rounded-lg font-bold text-lg cursor-pointer transition-all hover:scale-105 disabled:opacity-30"
                style={{ background: 'var(--color-gold)', color: 'var(--color-bg)' }}
              >
                Start Season
              </button>
            </div>
          </StepWrapper>
        )}

        {step === 5 && selectedTeamMeta && (
          <motion.div
            key="step5"
            className="flex flex-col items-center justify-center gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <motion.img
              src={selectedTeamMeta.logoUrl}
              alt={selectedTeamMeta.name}
              className="w-32 h-32 md:w-48 md:h-48"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <motion.h1
              className="text-3xl md:text-5xl font-bold text-center"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text)' }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              {franchiseName}
            </motion.h1>
            <motion.p
              className="text-sm"
              style={{ color: 'var(--color-text-muted)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.0, duration: 0.5 }}
            >
              The {seasonLength}-Game Season Begins
            </motion.p>
            <motion.div
              className="h-0.5 rounded-full"
              style={{ background: 'var(--color-gold)' }}
              initial={{ width: 0 }}
              animate={{ width: 200 }}
              transition={{ delay: 1.2, duration: 0.8, ease: 'easeInOut' }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StepWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      className="flex flex-col items-center w-full"
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.25 }}
    >
      {children}
    </motion.div>
  );
}
