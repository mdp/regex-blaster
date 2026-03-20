import { useState, useEffect, useRef, useCallback } from 'react';

const GAME_W = 720;
const GAME_H = 440;
const STRING_H = 32;

const TRAINING_LEVELS = [
  {
    id: 1,
    name: "Boot Sequence",
    concept: "Literal Matching",
    hint: "Type exact words, or use | for alternatives → bug|error",
    enemies: ["bug", "error", "crash", "fault", "glitch", "panic"],
    friendlies: [],
    fallSpeed: 0.28,
    spawnInterval: 2200,
  },
  {
    id: 2,
    name: "Pattern Recognition",
    concept: "The . Wildcard",
    hint: "A dot . matches ANY single character → .at matches cat, bat, hat...",
    enemies: ["cat", "bat", "hat", "rat", "sat", "mat", "fat", "pat"],
    friendlies: [],
    fallSpeed: 0.32,
    spawnInterval: 1800,
  },
  {
    id: 3,
    name: "Signal & Noise",
    concept: "Character Classes",
    hint: "[abc] matches one of a,b,c — [a-z] matches any lowercase letter. \\d matches a digit.",
    enemies: ["a1", "b2", "c3", "d4", "e5", "f6"],
    friendlies: ["ab", "cd", "ef", "gh"],
    fallSpeed: 0.35,
    spawnInterval: 1700,
  },
  {
    id: 4,
    name: "Overflow",
    concept: "Quantifiers",
    hint: "+ means one or more, * means zero or more, ? means optional → go+ matches go, goo, gooo",
    enemies: ["goo", "gooo", "goooo", "gooooo", "boo", "booo", "boooo"],
    friendlies: ["go", "bo", "no"],
    fallSpeed: 0.38,
    spawnInterval: 1500,
  },
  {
    id: 5,
    name: "Border Control",
    concept: "Start & End Anchors",
    hint: "^ matches start of string, $ matches end → ^pre matches 'prefix' but not 'unprepared'",
    enemies: ["pre_fix", "pre_load", "pre_set", "pre_view", "pre_heat"],
    friendlies: ["compress", "express", "repress", "depress"],
    fallSpeed: 0.40,
    spawnInterval: 1500,
  },
  {
    id: 6,
    name: "Double Agent",
    concept: "Negated Classes",
    hint: "[^x] means NOT x → ca[^u] matches cat, car, cap but NOT cup",
    enemies: ["cat", "car", "cap", "cab", "can", "cam"],
    friendlies: ["cup", "cut", "cub", "cur", "cue"],
    fallSpeed: 0.42,
    spawnInterval: 1400,
  },
  {
    id: 7,
    name: "Data Stream",
    concept: "Combined Patterns",
    hint: "Combine features: ^user_\\d+ matches 'user_001' but not 'admin_001'",
    enemies: ["user_001", "user_042", "user_100", "user_999", "user_007"],
    friendlies: ["admin_001", "root_042", "guest_100", "user"],
    fallSpeed: 0.44,
    spawnInterval: 1300,
  },
  {
    id: 8,
    name: "Escape Room",
    concept: "Escaping Special Chars",
    hint: "Use \\\\ to match literal special chars → \\\\. matches a real dot, \\\\( matches a real paren",
    enemies: ["price:$9.99", "price:$14.50", "price:$3.00", "price:$29.99", "price:$0.50"],
    friendlies: ["price:free", "price:TBD", "cost:$9.99", "price$9.99"],
    fallSpeed: 0.42,
    spawnInterval: 1400,
  },
  {
    id: 9,
    name: "Word Boundaries",
    concept: "\\b Word Boundaries",
    hint: "\\b matches between a word char and non-word char → \\bcat\\b matches 'cat' but not 'catch'",
    enemies: ["cat", "dog", "rat", "bat"],
    friendlies: ["catch", "catalog", "dogma", "rattle", "battle", "combat"],
    fallSpeed: 0.44,
    spawnInterval: 1300,
  },
  {
    id: 10,
    name: "Repeat Offender",
    concept: "Backreferences",
    hint: "(x)\\1 matches repeated captures → (\\w)\\1 matches 'aa', 'bb', 'cc' — doubled letters",
    enemies: ["aardvark", "eel", "balloon", "coffee", "toffee", "committee"],
    friendlies: ["arena", "blue", "cake", "desire", "forge", "tiger"],
    fallSpeed: 0.44,
    spawnInterval: 1300,
  },
  {
    id: 11,
    name: "Final Firewall",
    concept: "Everything Combined",
    hint: "No more training wheels. Find the pattern. Trust your skills.",
    enemies: ["err_2024-01", "err_2024-02", "err_2024-03", "err_2024-11", "err_2024-12"],
    friendlies: ["log_2024-01", "log_2024-02", "err_2023-01", "err_202401", "2024-01_err"],
    fallSpeed: 0.48,
    spawnInterval: 1200,
  },
  {
    id: 12,
    name: "Future Sight",
    concept: "Lookahead (?=) & (?!)",
    hint: "(?=x) checks ahead without consuming → \\d+(?=px) matches '12' in '12px'. (?!x) means NOT followed by x",
    enemies: ["100px", "24px", "8px", "320px", "50px", "16px"],
    friendlies: ["100em", "24rem", "8pt", "320vh", "50vw", "16%"],
    fallSpeed: 0.46,
    spawnInterval: 1200,
  },
];

// COMBAT LEVEL DESIGN NOTES (not shown to player):
// L1: ALERT + exactly 3 digits → ^ALERT-\d{3}$
// L2: lowercase hex color codes → ^#[0-9a-f]{6}$
// L3: HTTP + 4xx/5xx error codes → ^HTTP\/[45]\d\d$
// L4: v2.X.X (exactly, dots escaped) → ^v2\.\d\.\d$
// L5: 4+ digit ports that are open → ^port:\d{4,}:open$
// L6: rc- tag with v2 major → ^rc-2\.\d\.\d$
// L7: 2026, err, HIGH or CRIT → ^2026-\d{2}-err-(HIGH|CRIT)$
const COMBAT_LEVELS = [
  {
    id: 1,
    name: "Perimeter Scan",
    concept: "Anchors & Quantifiers",
    hint: null,
    enemies: ["ALERT-001", "ALERT-042", "ALERT-199", "ALERT-300", "ALERT-577", "ALERT-800", "ALERT-999", "ALERT-123"],
    friendlies: ["ALERT-1", "ALERT-02", "ALERT-1000", "NOTICE-001", "NOTICE-042", "WARN-199"],
    fallSpeed: 0.44,
    spawnInterval: 1400,
  },
  {
    id: 2,
    name: "Decoy Swarm",
    concept: "Character Classes",
    hint: null,
    enemies: ["#ff0000", "#00ff00", "#0000ff", "#ff8800", "#aa33cc", "#112233", "#deed00"],
    friendlies: ["#gg0000", "#ff000", "#ff00000", "ff0000", "#FF0000", "#zz1122", "#12345"],
    fallSpeed: 0.48,
    spawnInterval: 1200,
  },
  {
    id: 3,
    name: "Infiltration",
    concept: "Escaping & Groups",
    hint: null,
    enemies: ["HTTP/404", "HTTP/500", "HTTP/502", "HTTP/503", "HTTP/401", "HTTP/403", "HTTP/408", "HTTP/429"],
    friendlies: ["HTTP/200", "HTTP/201", "HTTP/301", "HTTP/304", "FTP/404", "TCP/500", "HTTP/99"],
    fallSpeed: 0.50,
    spawnInterval: 1100,
  },
  {
    id: 4,
    name: "Minefield",
    concept: "Escaped Dots & Anchors",
    hint: null,
    enemies: ["v2.0.0", "v2.1.0", "v2.2.0", "v2.0.1", "v2.1.1", "v2.2.1", "v2.3.0", "v2.3.1"],
    friendlies: ["v1.0.0", "v3.0.0", "v2.0", "v2.0.0.1", "v20.0", "v2_0_0", "v2.10.0"],
    fallSpeed: 0.52,
    spawnInterval: 1000,
  },
  {
    id: 5,
    name: "Ghost Protocol",
    concept: "Quantifiers & Structure",
    hint: null,
    enemies: ["port:3306:open", "port:5432:open", "port:6379:open", "port:8080:open", "port:9090:open", "port:27017:open"],
    friendlies: ["port:22:open", "port:80:open", "port:443:open", "port:3306:closed", "port:5432:filtered", "svc:8080:open"],
    fallSpeed: 0.54,
    spawnInterval: 950,
  },
  {
    id: 6,
    name: "Scorched Earth",
    concept: "Precision Patterns",
    hint: null,
    enemies: ["rc-2.0.1", "rc-2.0.2", "rc-2.1.0", "rc-2.1.1", "rc-2.2.0", "rc-2.2.1"],
    friendlies: ["rc-1.0.0", "rc-3.0.0", "beta-2.0.1", "alpha-2.1.0", "rc-2.0", "rc-2.0.1.1"],
    fallSpeed: 0.56,
    spawnInterval: 900,
  },
  {
    id: 7,
    name: "Final Assault",
    concept: "Full Arsenal",
    hint: null,
    enemies: [
      "2026-03-err-HIGH", "2026-04-err-HIGH", "2026-05-err-HIGH",
      "2026-03-err-CRIT", "2026-04-err-CRIT", "2026-05-err-CRIT",
      "2026-06-err-HIGH", "2026-06-err-CRIT",
      "2026-07-err-HIGH", "2026-07-err-CRIT",
    ],
    friendlies: [
      "2026-03-err-LOW", "2026-03-err-MED", "2026-03-warn-HIGH",
      "2025-03-err-HIGH", "2026-03-log-CRIT",
      "2026-03-err-high", "2026-04-warn-CRIT",
    ],
    fallSpeed: 0.58,
    spawnInterval: 850,
  },
];

// Boss mode waves — each themed around a regex skill, cycling with increasing difficulty
const BOSS_WAVES = [
  {
    name: "Literals",
    enemies: ["bug", "error", "crash", "fault", "glitch"],
    friendlies: [],
  },
  {
    name: "Wildcards",
    enemies: ["cat", "bat", "hat", "rat", "sat", "mat"],
    friendlies: ["cart", "bats", "hatch"],
  },
  {
    name: "Classes",
    enemies: ["a1", "b2", "c3", "d4", "e5", "f6"],
    friendlies: ["ab", "cd", "ef"],
  },
  {
    name: "Quantifiers",
    enemies: ["gooo", "goooo", "booo", "boooo", "mooo"],
    friendlies: ["go", "bo", "mo"],
  },
  {
    name: "Anchors",
    enemies: ["pre_fix", "pre_set", "pre_load", "pre_run"],
    friendlies: ["compress", "express", "unprepared"],
  },
  {
    name: "Negation",
    enemies: ["cat", "car", "cap", "cab", "can"],
    friendlies: ["cup", "cut", "cub", "cue"],
  },
  {
    name: "Escaping",
    enemies: ["$9.99", "$14.50", "$3.00", "$29.99"],
    friendlies: ["free", "$TBD", "9.99"],
  },
  {
    name: "Boundaries",
    enemies: ["log", "run", "set", "get"],
    friendlies: ["login", "runner", "reset", "getter"],
  },
  {
    name: "Groups",
    enemies: ["err:404", "err:500", "err:502", "err:503"],
    friendlies: ["err:200", "log:404", "err:301"],
  },
  {
    name: "Lookahead",
    enemies: ["100px", "24px", "50px", "8px", "320px"],
    friendlies: ["100em", "24rem", "50vw", "8pt"],
  },
  {
    name: "Hex Codes",
    enemies: ["#ff0000", "#00ff00", "#0000ff", "#aa33cc"],
    friendlies: ["#gg0000", "ff0000", "#FF0000", "#12345"],
  },
  {
    name: "Versions",
    enemies: ["v2.0.0", "v2.1.0", "v2.2.0", "v2.3.0"],
    friendlies: ["v1.0.0", "v3.0.0", "v2.0", "v2_0_0"],
  },
  {
    name: "Ports",
    enemies: ["port:3306:open", "port:5432:open", "port:8080:open"],
    friendlies: ["port:22:open", "port:80:open", "port:3306:closed"],
  },
  {
    name: "Timestamps",
    enemies: ["2026-03-err-HIGH", "2026-04-err-CRIT", "2026-05-err-HIGH"],
    friendlies: ["2025-03-err-HIGH", "2026-03-warn-HIGH", "2026-03-err-LOW"],
  },
];

function getBossDifficulty(waveNum) {
  const cycle = Math.floor(waveNum / BOSS_WAVES.length);
  return {
    fallSpeed: Math.min(0.75, 0.32 + cycle * 0.05),
    spawnInterval: Math.max(500, 1600 - cycle * 150),
  };
}

const STAGES = {
  training: { name: 'Training', levels: TRAINING_LEVELS, color: '#00f0ff', icon: '📡' },
  combat:   { name: 'Combat',   levels: COMBAT_LEVELS,   color: '#ff0080', icon: '⚔️' },
};

const CHEAT_SHEET = [
  ['.', 'Any single character'],
  ['\\d', 'Any digit (0-9)'],
  ['\\w', 'Word char (a-z, 0-9, _)'],
  ['\\s', 'Whitespace'],
  ['[abc]', 'One of a, b, or c'],
  ['[a-z]', 'Lowercase range'],
  ['[^x]', 'NOT x'],
  ['^', 'Start of string'],
  ['$', 'End of string'],
  ['\\b', 'Word boundary'],
  ['*', '0 or more'],
  ['+', '1 or more'],
  ['?', '0 or 1 (optional)'],
  ['{n,m}', 'n to m times'],
  ['(a|b)', 'a or b'],
  ['\\1', 'Backreference (repeat group)'],
  ['(?=x)', 'Lookahead (followed by x)'],
  ['(?!x)', 'Neg lookahead (NOT followed)'],
  ['\\.', 'Literal dot (escaped)'],
];

const FONT_URL = 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700;800&family=Orbitron:wght@700;900&display=swap';

function tryRegex(pattern) {
  try {
    new RegExp(pattern);
    return { valid: true, regex: new RegExp(pattern) };
  } catch (e) {
    return { valid: false, error: e.message };
  }
}

let nextId = 0;
function uid() { return ++nextId; }

function buildSpawnQueue(enemies, friendlies) {
  const allStrings = [
    ...enemies.map(t => ({ text: t, isEnemy: true })),
    ...friendlies.map(t => ({ text: t, isEnemy: false })),
  ];
  for (let i = allStrings.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allStrings[i], allStrings[j]] = [allStrings[j], allStrings[i]];
  }
  return allStrings.map(s => {
    const textWidth = Math.max(65, s.text.length * 12 + 28);
    return {
      ...s,
      id: uid(),
      x: Math.random() * (GAME_W - textWidth - 20) + 10,
      y: -STRING_H - Math.random() * 20,
      width: textWidth,
      destroyed: false,
      matched: false,
    };
  });
}

export default function RegexBlaster() {
  const [phase, setPhase] = useState('menu');
  const [stage, setStage] = useState(null); // 'training' | 'combat' | 'boss'
  const [levelIdx, setLevelIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(5);
  const [input, setInput] = useState('');
  const [strings, setStrings] = useState([]);
  const [effects, setEffects] = useState([]);
  const [error, setError] = useState('');
  const [levelTime, setLevelTime] = useState(0);
  const [patternsFired, setPatternsFired] = useState(0);
  const [levelScore, setLevelScore] = useState(null);
  const [scanLine, setScanLine] = useState(false);
  const [shake, setShake] = useState(false);
  const [maxTrainingLevel, setMaxTrainingLevel] = useState(0);
  const [maxCombatLevel, setMaxCombatLevel] = useState(0);
  const [patternLoaded, setPatternLoaded] = useState(false);
  const [patternHistory, setPatternHistory] = useState([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [bossWave, setBossWave] = useState(0);
  const [bossHighScore, setBossHighScore] = useState(() => {
    try { return Number(localStorage.getItem('regex-blaster-boss-highscore')) || 0; } catch { return 0; }
  });
  const [bossHighWave, setBossHighWave] = useState(() => {
    try { return Number(localStorage.getItem('regex-blaster-boss-highwave')) || 0; } catch { return 0; }
  });
  const [waveAnnounce, setWaveAnnounce] = useState(null);

  const inputRef = useRef(null);
  const stringsRef = useRef([]);
  const livesRef = useRef(5);
  const spawnQueueRef = useRef([]);
  const spawnTimerRef = useRef(null);
  const animRef = useRef(null);
  const startTimeRef = useRef(null);
  const phaseRef = useRef('menu');
  const enemiesLeftRef = useRef(0);
  const stageRef = useRef(null);
  const bossWaveRef = useRef(0);

  stringsRef.current = strings;
  livesRef.current = lives;
  phaseRef.current = phase;
  stageRef.current = stage;
  bossWaveRef.current = bossWave;

  const currentLevels = stage && stage !== 'boss' ? STAGES[stage].levels : [];
  const currentLevel = stage === 'boss'
    ? BOSS_WAVES[bossWave % BOSS_WAVES.length]
    : currentLevels[levelIdx];
  const maxLevel = stage === 'training' ? maxTrainingLevel : maxCombatLevel;

  // Start a normal level
  const startLevel = useCallback((stageKey, idx) => {
    const levels = STAGES[stageKey].levels;
    const lv = levels[idx];
    if (!lv) return;

    setStage(stageKey);
    setLevelIdx(idx);
    setInput('');
    setError('');
    setPatternsFired(0);
    setEffects([]);
    setStrings([]);
    setLevelScore(null);
    setPatternLoaded(false);
    setPatternHistory([]);
    setHistoryIdx(-1);

    const queue = buildSpawnQueue(lv.enemies, lv.friendlies);
    spawnQueueRef.current = queue;
    enemiesLeftRef.current = lv.enemies.length;
    startTimeRef.current = Date.now();

    setPhase('playing');
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  // Start boss mode
  const startBoss = useCallback(() => {
    setStage('boss');
    setBossWave(0);
    bossWaveRef.current = 0;
    setLevelIdx(0);
    setInput('');
    setError('');
    setPatternsFired(0);
    setEffects([]);
    setStrings([]);
    setLevelScore(null);
    setPatternLoaded(false);
    setPatternHistory([]);
    setHistoryIdx(-1);
    setScore(0);
    setLives(5);
    livesRef.current = 5;

    const wave = BOSS_WAVES[0];
    const queue = buildSpawnQueue(wave.enemies, wave.friendlies);
    spawnQueueRef.current = queue;
    enemiesLeftRef.current = wave.enemies.length;
    startTimeRef.current = Date.now();

    setWaveAnnounce({ num: 1, name: wave.name });
    setTimeout(() => setWaveAnnounce(null), 2000);

    setPhase('playing');
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  // Load next boss wave (called from game loop)
  const loadNextBossWave = useCallback((nextWaveNum) => {
    const waveData = BOSS_WAVES[nextWaveNum % BOSS_WAVES.length];
    const queue = buildSpawnQueue(waveData.enemies, waveData.friendlies);
    spawnQueueRef.current = queue;
    enemiesLeftRef.current = waveData.enemies.length;

    setBossWave(nextWaveNum);
    bossWaveRef.current = nextWaveNum;

    setWaveAnnounce({ num: nextWaveNum + 1, name: waveData.name });
    setTimeout(() => setWaveAnnounce(null), 2000);
  }, []);

  // Game loop
  useEffect(() => {
    if (phase !== 'playing') {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      if (spawnTimerRef.current) clearInterval(spawnTimerRef.current);
      return;
    }

    const isBoss = stageRef.current === 'boss';
    let fallSpeed, spawnInterval;

    if (isBoss) {
      const diff = getBossDifficulty(bossWaveRef.current);
      fallSpeed = diff.fallSpeed;
      spawnInterval = diff.spawnInterval;
    } else {
      const levels = STAGES[stageRef.current].levels;
      const lv = levels[levelIdx];
      fallSpeed = lv.fallSpeed;
      spawnInterval = lv.spawnInterval;
    }

    let lastTime = performance.now();
    let spawnAccum = 0;
    let spawnIdx = 0;
    let totalToSpawn = spawnQueueRef.current.length;

    const loop = (now) => {
      if (phaseRef.current !== 'playing') return;

      const dt = Math.min(now - lastTime, 50);
      lastTime = now;

      // Spawn logic
      spawnAccum += dt;
      if (spawnAccum >= spawnInterval && spawnIdx < totalToSpawn) {
        const item = spawnQueueRef.current[spawnIdx];
        spawnIdx++;
        spawnAccum = 0;
        setStrings(prev => [...prev, item]);
      }

      // Move strings down
      setStrings(prev => {
        let newLives = livesRef.current;
        let lostLife = false;

        const updated = prev.map(s => {
          if (s.destroyed) return s;
          const newY = s.y + fallSpeed * dt * 0.06;

          if (newY > GAME_H - 10) {
            if (s.isEnemy) {
              newLives--;
              lostLife = true;
              enemiesLeftRef.current--;
            }
            return { ...s, y: newY, destroyed: true };
          }
          return { ...s, y: newY };
        }).filter(s => !(s.destroyed && s.y > GAME_H + 50));

        if (lostLife) {
          setLives(newLives);
          setShake(true);
          setTimeout(() => setShake(false), 300);
          if (newLives <= 0) {
            setPhase('gameover');
          }
        }

        // Check win condition — all enemies cleared
        const activeEnemies = updated.filter(s => s.isEnemy && !s.destroyed);
        const remainingQueueEnemies = spawnQueueRef.current.slice(spawnIdx).filter(s => s.isEnemy).length;

        if (activeEnemies.length === 0 && remainingQueueEnemies === 0 && spawnIdx > 0) {
          if (isBoss) {
            // Boss mode: load next wave, don't stop
            const nextWave = bossWaveRef.current + 1;
            loadNextBossWave(nextWave);
            // Reset spawn tracking for new wave
            spawnIdx = 0;
            spawnAccum = 0;
            totalToSpawn = spawnQueueRef.current.length;
            // Update difficulty for new wave
            const diff = getBossDifficulty(nextWave);
            fallSpeed = diff.fallSpeed;
            spawnInterval = diff.spawnInterval;
            // Bonus points for wave clear
            setScore(s => s + 500);
            setEffects(prev => [...prev, {
              id: uid(),
              x: GAME_W / 2,
              y: GAME_H / 2,
              text: `WAVE ${nextWave} CLEARED +500`,
              type: 'combo',
            }]);
            setTimeout(() => {
              setEffects(prev => prev.slice(-5));
            }, 1200);
            // Drop remaining friendlies — wave is over
            return updated.filter(s => s.isEnemy || s.destroyed);
          } else {
            const elapsed = Date.now() - startTimeRef.current;
            setLevelTime(elapsed);
            const timeBonus = Math.max(0, Math.floor(5000 - elapsed / 10));
            setLevelScore({ timeBonus, elapsed });
            const curStage = stageRef.current;
            if (curStage === 'training') {
              setMaxTrainingLevel(prev => Math.max(prev, levelIdx + 1));
            } else {
              setMaxCombatLevel(prev => Math.max(prev, levelIdx + 1));
            }
            setPhase('levelComplete');
          }
        }

        return updated;
      });

      // Update displayed time
      if (startTimeRef.current) {
        setLevelTime(Date.now() - startTimeRef.current);
      }

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [phase, levelIdx, loadNextBossWave]);

  // Fire regex
  const fire = useCallback(() => {
    if (!input.trim() || phase !== 'playing') return;

    const result = tryRegex(input.trim());
    if (!result.valid) {
      setError('Invalid regex!');
      setTimeout(() => setError(''), 1500);
      return;
    }

    // Check for friendly hits before firing — refuse if any would be hit
    const regex = result.regex;
    const active = stringsRef.current.filter(s => !s.destroyed);
    const wouldHitFriendly = active.some(s => !s.isEnemy && regex.test(s.text));
    if (wouldHitFriendly) {
      setError('🛡 Pattern would hit friendlies — refine your regex!');
      setTimeout(() => setError(''), 2000);
      return;
    }

    setError('');
    setPatternsFired(p => p + 1);
    setScanLine(true);
    setTimeout(() => setScanLine(false), 400);

    let hits = 0;
    const newEffects = [];

    setStrings(prev => prev.map(s => {
      if (s.destroyed) return s;
      const matches = regex.test(s.text);
      if (matches) {
        hits++;
        enemiesLeftRef.current--;
        newEffects.push({
          id: uid(),
          x: s.x + s.width / 2,
          y: s.y,
          text: '+100',
          type: 'hit',
        });
        return { ...s, destroyed: true, matched: true };
      }
      return s;
    }));

    if (hits > 1) {
      const combo = hits;
      const comboBonus = (combo - 1) * 150;
      newEffects.push({
        id: uid(),
        x: GAME_W / 2,
        y: GAME_H / 2,
        text: `${combo}x COMBO +${comboBonus}`,
        type: 'combo',
      });
      setScore(s => s + hits * 100 + comboBonus);
    } else if (hits > 0) {
      setScore(s => s + hits * 100);
    }

    if (hits === 0) {
      newEffects.push({
        id: uid(),
        x: GAME_W / 2,
        y: GAME_H / 2,
        text: 'NO MATCH',
        type: 'miss',
      });
    }

    setEffects(prev => [...prev, ...newEffects]);
    setTimeout(() => {
      setEffects(prev => prev.filter(e => !newEffects.find(n => n.id === e.id)));
    }, 1200);

    setTimeout(() => {
      setStrings(prev => prev.filter(s => !(s.matched && s.destroyed)));
    }, 600);

    setPatternLoaded(true);
    setPatternHistory(prev => {
      const trimmed = input.trim();
      if (prev[prev.length - 1] === trimmed) return prev;
      return [...prev, trimmed];
    });
    setHistoryIdx(-1);
    setTimeout(() => inputRef.current?.focus(), 10);
  }, [input, phase]);

  const handleKey = (e) => {
    if (e.key === 'Enter') {
      fire();
    } else if (e.key === 'Escape') {
      setInput('');
      setPatternLoaded(false);
      setHistoryIdx(-1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (patternHistory.length === 0) return;
      const newIdx = historyIdx === -1
        ? patternHistory.length - 1
        : Math.max(0, historyIdx - 1);
      setHistoryIdx(newIdx);
      setInput(patternHistory[newIdx]);
      setPatternLoaded(true);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIdx === -1) return;
      if (historyIdx >= patternHistory.length - 1) {
        setHistoryIdx(-1);
        setInput('');
        setPatternLoaded(false);
      } else {
        const newIdx = historyIdx + 1;
        setHistoryIdx(newIdx);
        setInput(patternHistory[newIdx]);
        setPatternLoaded(true);
      }
    } else {
      if (patternLoaded) {
        setPatternLoaded(false);
        setHistoryIdx(-1);
      }
    }
  };

  const resetGame = () => {
    setScore(0);
    setLives(5);
    setPhase('menu');
    setStage(null);
    setInput('');
    setStrings([]);
    setEffects([]);
    setError('');
    setLevelScore(null);
    setPatternLoaded(false);
    setPatternHistory([]);
    setHistoryIdx(-1);
    setBossWave(0);
    setWaveAnnounce(null);
    livesRef.current = 5;
  };

  const goToStageSelect = (stageKey) => {
    setStage(stageKey);
    setPhase('stageSelect');
  };

  // Global Enter key handler for non-playing screens
  useEffect(() => {
    if (phase === 'playing') return;
    const handleGlobalKey = (e) => {
      if (e.key !== 'Enter') return;
      if (phase === 'stageSelect' && stage) {
        const ml = stage === 'training' ? maxTrainingLevel : maxCombatLevel;
        setScore(0); setLives(5); livesRef.current = 5; startLevel(stage, ml);
      } else if (phase === 'levelComplete' && levelScore && stage) {
        const levels = STAGES[stage].levels;
        if (levelIdx < levels.length - 1) {
          setScore(s => s + levelScore.timeBonus);
          startLevel(stage, levelIdx + 1);
        } else {
          setScore(s => s + levelScore.timeBonus);
          startLevel(stage, levelIdx);
        }
      } else if (phase === 'gameover') {
        if (stage === 'boss') {
          startBoss();
        } else if (stage) {
          setLives(5); livesRef.current = 5; startLevel(stage, levelIdx);
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, [phase, stage, maxTrainingLevel, maxCombatLevel, levelIdx, levelScore, startLevel, startBoss]);

  // Update boss high scores on game over
  useEffect(() => {
    if (phase === 'gameover' && stage === 'boss') {
      setBossHighScore(prev => {
        const next = Math.max(prev, score);
        try { localStorage.setItem('regex-blaster-boss-highscore', next); } catch {}
        return next;
      });
      setBossHighWave(prev => {
        const next = Math.max(prev, bossWave + 1);
        try { localStorage.setItem('regex-blaster-boss-highwave', next); } catch {}
        return next;
      });
    }
  }, [phase, stage, score, bossWave]);

  // Live preview
  const previewRegex = (() => {
    if (!input.trim() || phase !== 'playing') return null;
    const r = tryRegex(input.trim());
    return r.valid ? r.regex : null;
  })();

  const formatTime = (ms) => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const sec = s % 60;
    const centis = Math.floor((ms % 1000) / 10);
    return `${m}:${String(sec).padStart(2, '0')}.${String(centis).padStart(2, '0')}`;
  };

  const getStars = (elapsed, patternsFired, lv) => {
    const enemyCount = lv.enemies.length;
    const efficiency = patternsFired <= Math.ceil(enemyCount / 3) ? 1 : patternsFired <= enemyCount ? 0.5 : 0;
    const speed = elapsed < enemyCount * 3000 ? 1 : elapsed < enemyCount * 5000 ? 0.5 : 0;
    const total = efficiency + speed;
    if (total >= 1.5) return 3;
    if (total >= 0.8) return 2;
    return 1;
  };

  const stageColor = stage === 'boss' ? '#ffcc00' : stage ? STAGES[stage].color : '#00f0ff';
  const stageIcon = stage === 'boss' ? '💀' : stage ? STAGES[stage].icon : '';

  const bossWaveData = BOSS_WAVES[bossWave % BOSS_WAVES.length];
  const bossCycle = Math.floor(bossWave / BOSS_WAVES.length);

  // Cheat sheet panel
  const cheatSheetPanel = (
    <div style={{
      width: '240px',
      background: '#0a1020',
      border: '1px solid #1a2a3a',
      borderRadius: '8px',
      padding: '12px',
      fontSize: '13px',
      flexShrink: 0,
    }}>
      <div style={{
        fontWeight: 800,
        fontSize: '12px',
        color: '#667',
        letterSpacing: '2px',
        marginBottom: '10px',
        textAlign: 'center',
      }}>
        REGEX CHEAT SHEET
      </div>
      {CHEAT_SHEET.map(([syntax, desc], i) => (
        <div key={i} style={{
          display: 'flex',
          gap: '8px',
          padding: '3px 0',
          borderBottom: i < CHEAT_SHEET.length - 1 ? '1px solid #111' : 'none',
        }}>
          <span style={{
            color: '#00f0ff',
            fontWeight: 700,
            minWidth: '52px',
            fontFamily: "'JetBrains Mono', monospace",
          }}>{syntax}</span>
          <span style={{ color: '#556' }}>{desc}</span>
        </div>
      ))}
    </div>
  );

  return (
    <div style={{
      minHeight: '100vh',
      background: '#06080f',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'JetBrains Mono', monospace",
      color: '#c8d6e5',
      overflow: 'hidden',
    }}>
      <link href={FONT_URL} rel="stylesheet" />
      <style>{`
        @keyframes fadeUp {
          0% { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-60px) scale(1.3); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
        @keyframes scanDown {
          0% { top: 0; opacity: 1; }
          100% { top: 100%; opacity: 0.2; }
        }
        @keyframes destroyFlash {
          0% { transform: scale(1); opacity: 1; filter: brightness(3); }
          50% { transform: scale(1.4); opacity: 0.7; }
          100% { transform: scale(0.5); opacity: 0; }
        }
        @keyframes shakeAnim {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 0 8px rgba(0, 240, 255, 0.3); }
          50% { box-shadow: 0 0 20px rgba(0, 240, 255, 0.6); }
        }
        @keyframes glowPulseRed {
          0%, 100% { box-shadow: 0 0 8px rgba(255, 0, 128, 0.3); }
          50% { box-shadow: 0 0 20px rgba(255, 0, 128, 0.6); }
        }
        @keyframes glowPulseGold {
          0%, 100% { box-shadow: 0 0 8px rgba(255, 204, 0, 0.3); }
          50% { box-shadow: 0 0 20px rgba(255, 204, 0, 0.6); }
        }
        @keyframes gridMove {
          0% { background-position: 0 0; }
          100% { background-position: 0 40px; }
        }
        @keyframes entryFade {
          0% { opacity: 0; transform: translateY(-20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes waveSlide {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
          20% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
          30% { transform: translate(-50%, -50%) scale(1); }
          80% { opacity: 1; }
          100% { opacity: 0; }
        }
        .star { color: #333; font-size: 28px; }
        .star.lit { color: #ffcc00; text-shadow: 0 0 10px #ffcc00; }
      `}</style>

      {/* MAIN MENU — stage selection */}
      {phase === 'menu' && (
        <div style={{ textAlign: 'center', animation: 'entryFade 0.5s ease' }}>
          <div style={{
            fontFamily: "'Orbitron', sans-serif",
            fontSize: '52px',
            fontWeight: 900,
            letterSpacing: '4px',
            background: 'linear-gradient(135deg, #00f0ff, #ff0080)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '8px',
          }}>
            REGEX BLASTER
          </div>
          <div style={{ fontSize: '16px', color: '#667', marginBottom: '50px', letterSpacing: '3px' }}>
            PATTERN MATCHING DEFENSE
          </div>

          <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginBottom: '24px' }}>
            {/* Training card */}
            <button
              onClick={() => goToStageSelect('training')}
              style={{
                width: '220px',
                padding: '24px 20px',
                background: 'linear-gradient(180deg, #0a1628, #0c1e38)',
                border: '1px solid #00f0ff',
                borderRadius: '10px',
                color: '#c8d6e5',
                fontFamily: "'JetBrains Mono', monospace",
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.2s',
                animation: 'glowPulse 3s ease infinite',
              }}
            >
              <div style={{ fontSize: '28px', marginBottom: '10px' }}>📡</div>
              <div style={{
                fontFamily: "'Orbitron', sans-serif",
                fontSize: '16px',
                fontWeight: 900,
                color: '#00f0ff',
                marginBottom: '6px',
              }}>TRAINING</div>
              <div style={{ fontSize: '13px', color: '#556', lineHeight: 1.5 }}>
                Learn with hints
              </div>
              <div style={{ fontSize: '13px', color: '#334', marginTop: '10px' }}>
                {maxTrainingLevel}/{TRAINING_LEVELS.length} cleared
              </div>
            </button>

            {/* Combat card */}
            <button
              onClick={() => goToStageSelect('combat')}
              style={{
                width: '220px',
                padding: '24px 20px',
                background: 'linear-gradient(180deg, #1a0a18, #2a0c20)',
                border: '1px solid #ff0080',
                borderRadius: '10px',
                color: '#c8d6e5',
                fontFamily: "'JetBrains Mono', monospace",
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.2s',
                animation: 'glowPulseRed 3s ease infinite',
              }}
            >
              <div style={{ fontSize: '28px', marginBottom: '10px' }}>⚔️</div>
              <div style={{
                fontFamily: "'Orbitron', sans-serif",
                fontSize: '16px',
                fontWeight: 900,
                color: '#ff0080',
                marginBottom: '6px',
              }}>COMBAT</div>
              <div style={{ fontSize: '13px', color: '#556', lineHeight: 1.5 }}>
                No hints. No mercy.
              </div>
              <div style={{ fontSize: '13px', color: '#334', marginTop: '10px' }}>
                {maxCombatLevel}/{COMBAT_LEVELS.length} cleared
              </div>
            </button>

            {/* Boss card */}
            <button
              onClick={startBoss}
              style={{
                width: '220px',
                padding: '24px 20px',
                background: 'linear-gradient(180deg, #1a1500, #2a2000)',
                border: '1px solid #ffcc00',
                borderRadius: '10px',
                color: '#c8d6e5',
                fontFamily: "'JetBrains Mono', monospace",
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.2s',
                animation: 'glowPulseGold 3s ease infinite',
              }}
            >
              <div style={{ fontSize: '28px', marginBottom: '10px' }}>💀</div>
              <div style={{
                fontFamily: "'Orbitron', sans-serif",
                fontSize: '16px',
                fontWeight: 900,
                color: '#ffcc00',
                marginBottom: '6px',
              }}>BOSS</div>
              <div style={{ fontSize: '13px', color: '#556', lineHeight: 1.5 }}>
                Endless. Survive.
              </div>
              <div style={{ fontSize: '13px', color: '#334', marginTop: '10px' }}>
                {bossHighWave > 0 ? `Best: Wave ${bossHighWave}` : 'Unplayed'}
              </div>
            </button>
          </div>

          <div style={{ fontSize: '14px', color: '#445', maxWidth: '500px', lineHeight: 1.6, margin: '0 auto', textAlign: 'center' }}>
            Write regex patterns to destroy falling strings.
            <span style={{ color: '#ff6b35' }}> 👾 Orange = enemies</span>
            {' '}(destroy them).
            <span style={{ color: '#00ff88' }}> 🛡 Green = friendlies</span>
            {' '}(don't hit them!).
          </div>
        </div>
      )}

      {/* STAGE SELECT — level list */}
      {phase === 'stageSelect' && stage && stage !== 'boss' && (
        <div style={{ textAlign: 'center', animation: 'entryFade 0.5s ease' }}>
          <div style={{
            fontFamily: "'Orbitron', sans-serif",
            fontSize: '28px',
            fontWeight: 900,
            color: stageColor,
            marginBottom: '6px',
          }}>
            {STAGES[stage].icon} {STAGES[stage].name.toUpperCase()}
          </div>
          <div style={{ fontSize: '14px', color: '#445', marginBottom: '30px' }}>
            {stage === 'training' ? 'Guided missions with hints' : 'No hints — use the cheat sheet'}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center', marginBottom: '30px' }}>
            {currentLevels.map((lv, i) => {
              const ml = stage === 'training' ? maxTrainingLevel : maxCombatLevel;
              const isNext = i === ml;
              const locked = i > ml;
              return (
                <button
                  key={lv.id}
                  onClick={() => { setScore(0); setLives(5); livesRef.current = 5; startLevel(stage, i); }}
                  disabled={locked}
                  style={{
                    width: '380px',
                    padding: '12px 20px',
                    background: locked ? '#111' : isNext ? `linear-gradient(90deg, ${stage === 'training' ? '#0a1628' : '#1a0a18'}, ${stage === 'training' ? '#0f2040' : '#2a0c20'})` : '#0a1225',
                    border: isNext ? `1px solid ${stageColor}` : '1px solid #1a2a3a',
                    borderRadius: '6px',
                    color: locked ? '#333' : '#c8d6e5',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '14px',
                    cursor: locked ? 'not-allowed' : 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    animation: isNext ? (stage === 'training' ? 'glowPulse 2s ease infinite' : 'glowPulseRed 2s ease infinite') : 'none',
                    transition: 'all 0.2s',
                  }}
                >
                  <span>
                    <span style={{ color: stageColor, marginRight: '10px' }}>{String(lv.id).padStart(2, '0')}</span>
                    {lv.name}
                  </span>
                  <span style={{ color: '#667', fontSize: '13px' }}>{lv.concept}</span>
                </button>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              onClick={() => { setPhase('menu'); setStage(null); }}
              style={{
                padding: '10px 24px',
                background: 'transparent',
                border: '1px solid #333',
                borderRadius: '6px',
                color: '#667',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              BACK
            </button>
          </div>
          <div style={{ marginTop: '16px', fontSize: '13px', color: '#334' }}>
            Press ENTER to start next level
          </div>
        </div>
      )}

      {/* PLAYING */}
      {phase === 'playing' && currentLevel && (
        <div style={{ display: 'flex', gap: '16px', animation: shake ? 'shakeAnim 0.3s ease' : 'none' }}>
          <div>
            {/* HUD */}
            <div style={{
              width: GAME_W,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px 0',
              marginBottom: '4px',
              fontSize: '15px',
            }}>
              <div>
                {stage === 'boss' ? (
                  <>
                    <span style={{ color: '#ffcc00' }}>💀 </span>
                    <span style={{ color: '#ffcc00', fontWeight: 700 }}>WAVE {bossWave + 1}</span>
                    <span style={{ color: '#667', fontSize: '13px', marginLeft: '8px' }}>{bossWaveData.name}</span>
                    {bossCycle > 0 && <span style={{ color: '#ff6b35', fontSize: '13px', marginLeft: '6px' }}>×{bossCycle + 1}</span>}
                  </>
                ) : (
                  <>
                    <span style={{ color: '#667' }}>{stageIcon} </span>
                    <span style={{ color: stageColor, fontWeight: 700 }}>{currentLevel.name}</span>
                  </>
                )}
              </div>
              <div style={{ display: 'flex', gap: '24px' }}>
                <span>
                  <span style={{ color: '#667' }}>SCORE </span>
                  <span style={{ color: '#ffcc00', fontWeight: 700 }}>{score}</span>
                </span>
                <span>
                  <span style={{ color: '#667' }}>LIVES </span>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} style={{ color: i < lives ? '#ff0080' : '#222', marginLeft: '2px' }}>♥</span>
                  ))}
                </span>
                <span>
                  <span style={{ color: '#667' }}>TIME </span>
                  <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatTime(levelTime)}</span>
                </span>
              </div>
            </div>

            {/* Game Area */}
            <div style={{
              width: GAME_W,
              height: GAME_H,
              background: '#080c16',
              border: `1px solid ${stage === 'boss' ? '#2a2510' : '#1a2535'}`,
              borderRadius: '8px',
              position: 'relative',
              overflow: 'hidden',
              backgroundImage: `linear-gradient(${stage === 'boss' ? 'rgba(255,204,0,0.015)' : 'rgba(0,240,255,0.02)'} 1px, transparent 1px)`,
              backgroundSize: '100% 40px',
              animation: 'gridMove 4s linear infinite',
            }}>
              {/* Wave announcement overlay */}
              {waveAnnounce && (
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 30,
                  textAlign: 'center',
                  animation: 'waveSlide 2s ease forwards',
                  pointerEvents: 'none',
                }}>
                  <div style={{
                    fontFamily: "'Orbitron', sans-serif",
                    fontSize: '28px',
                    fontWeight: 900,
                    color: '#ffcc00',
                    textShadow: '0 0 30px rgba(255,204,0,0.5)',
                  }}>
                    WAVE {waveAnnounce.num}
                  </div>
                  <div style={{ fontSize: '14px', color: '#aa8800', marginTop: '4px' }}>
                    {waveAnnounce.name}
                  </div>
                </div>
              )}

              {/* Scan line effect on fire */}
              {scanLine && (
                <div style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  height: '3px',
                  background: `linear-gradient(90deg, transparent, ${stageColor}, transparent)`,
                  animation: 'scanDown 0.4s ease-out',
                  zIndex: 10,
                  boxShadow: `0 0 20px ${stageColor}`,
                }} />
              )}

              {/* Danger zone at bottom */}
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: 'linear-gradient(90deg, transparent, #ff0080, transparent)',
                opacity: 0.6,
              }} />

              {/* Falling strings */}
              {strings.map(s => {
                const previewed = !s.destroyed && previewRegex && previewRegex.test(s.text);
                return (
                  <div key={s.id} style={{
                    position: 'absolute',
                    left: s.x,
                    top: s.y,
                    padding: '4px 12px',
                    borderRadius: '4px',
                    fontSize: '15px',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    transition: s.matched ? 'none' : 'box-shadow 0.15s, border-color 0.15s',
                    ...(s.matched && s.destroyed ? {
                      animation: 'destroyFlash 0.5s ease forwards',
                      background: s.isEnemy ? 'rgba(0, 240, 255, 0.3)' : 'rgba(255, 0, 128, 0.3)',
                      color: '#fff',
                      border: `1px solid ${s.isEnemy ? '#00f0ff' : '#ff0080'}`,
                      boxShadow: `0 0 20px ${s.isEnemy ? '#00f0ff' : '#ff0080'}`,
                    } : s.destroyed ? {
                      opacity: 0,
                    } : previewed ? {
                      background: s.isEnemy ? 'rgba(0, 240, 255, 0.1)' : 'rgba(255, 0, 128, 0.15)',
                      color: s.isEnemy ? '#00f0ff' : '#ff4090',
                      border: `1px solid ${s.isEnemy ? '#00f0ff' : '#ff0080'}`,
                      boxShadow: `0 0 12px ${s.isEnemy ? 'rgba(0,240,255,0.4)' : 'rgba(255,0,128,0.4)'}`,
                    } : s.isEnemy ? {
                      background: 'rgba(255, 107, 53, 0.12)',
                      color: '#ff6b35',
                      border: '1px solid rgba(255, 107, 53, 0.3)',
                    } : {
                      background: 'rgba(0, 255, 136, 0.1)',
                      color: '#00ff88',
                      border: '1px solid rgba(0, 255, 136, 0.25)',
                    }),
                  }}>
                    {!s.destroyed && s.isEnemy && <span style={{ marginRight: '5px', fontSize: '12px' }}>👾</span>}
                    {!s.destroyed && !s.isEnemy && <span style={{ marginRight: '5px', fontSize: '12px' }}>🛡</span>}
                    {s.text}
                  </div>
                );
              })}

              {/* Floating effects */}
              {effects.map(e => (
                <div key={e.id} style={{
                  position: 'absolute',
                  left: e.x,
                  top: e.y,
                  transform: 'translateX(-50%)',
                  animation: 'fadeUp 1.2s ease forwards',
                  fontWeight: 800,
                  fontSize: e.type === 'combo' ? '22px' : '14px',
                  color: e.type === 'hit' ? '#00f0ff' : e.type === 'combo' ? '#ffcc00' : e.type === 'misfire' ? '#ff0080' : '#555',
                  textShadow: e.type === 'combo' ? '0 0 20px #ffcc00' : 'none',
                  zIndex: 20,
                  pointerEvents: 'none',
                }}>
                  {e.text}
                </div>
              ))}

              {/* No strings yet message */}
              {strings.length === 0 && !waveAnnounce && (
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  color: '#334',
                  fontSize: '14px',
                  animation: 'pulse 1.5s ease infinite',
                }}>
                  Incoming...
                </div>
              )}
            </div>

            {/* Hint (training only) or legend */}
            {currentLevel.hint ? (
              <div style={{
                width: GAME_W,
                padding: '8px 0 6px',
                fontSize: '14px',
                color: '#445',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
              }}>
                <span>
                  <span style={{ color: '#00f0ff', marginRight: '8px' }}>HINT:</span>
                  {currentLevel.hint}
                </span>
                {currentLevel.friendlies.length > 0 && (
                  <span style={{ fontSize: '13px', whiteSpace: 'nowrap', marginLeft: '12px' }}>
                    <span style={{ color: '#ff6b35' }}>👾 shoot</span>
                    <span style={{ margin: '0 6px', color: '#333' }}>·</span>
                    <span style={{ color: '#00ff88' }}>🛡 don't shoot</span>
                  </span>
                )}
              </div>
            ) : (
              <div style={{
                width: GAME_W,
                padding: '8px 0 6px',
                fontSize: '13px',
                color: '#334',
                display: 'flex',
                justifyContent: 'space-between',
              }}>
                <span style={{ color: '#ff6b35' }}>👾 shoot</span>
                <span style={{ color: '#00ff88' }}>🛡 don't shoot</span>
              </div>
            )}

            {/* Input */}
            <div style={{
              width: GAME_W,
              display: 'flex',
              gap: '8px',
              alignItems: 'center',
              position: 'relative',
            }}>
              <span style={{ color: patternLoaded ? '#ffcc00' : stageColor, fontSize: '16px', fontWeight: 700, transition: 'color 0.2s' }}>/</span>
              <div style={{ flex: 1, position: 'relative' }}>
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => {
                    setInput(e.target.value);
                    if (patternLoaded) {
                      setPatternLoaded(false);
                      setHistoryIdx(-1);
                    }
                  }}
                  onKeyDown={handleKey}
                  placeholder="type your regex pattern..."
                  spellCheck={false}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    paddingRight: patternLoaded ? '80px' : '14px',
                    background: patternLoaded ? '#0c1220' : '#0a0e1a',
                    border: error ? '1px solid #ff0040' : patternLoaded ? '1px solid rgba(255,204,0,0.5)' : '1px solid #1a2a3a',
                    borderRadius: '6px',
                    color: patternLoaded ? '#ffcc00' : '#e0e8f0',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '16px',
                    outline: 'none',
                    caretColor: stageColor,
                    transition: 'border-color 0.2s, color 0.2s, background 0.2s',
                    boxShadow: patternLoaded ? '0 0 12px rgba(255,204,0,0.15)' : 'none',
                    boxSizing: 'border-box',
                  }}
                  onFocus={e => { if (!error && !patternLoaded) e.target.style.borderColor = stageColor; }}
                  onBlur={e => { if (!error && !patternLoaded) e.target.style.borderColor = '#1a2a3a'; }}
                />
                {patternLoaded && (
                  <span style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '10px',
                    fontWeight: 700,
                    color: '#ffcc00',
                    letterSpacing: '1.5px',
                    opacity: 0.8,
                    pointerEvents: 'none',
                  }}>
                    LOADED
                  </span>
                )}
              </div>
              <span style={{ color: patternLoaded ? '#ffcc00' : stageColor, fontSize: '16px', fontWeight: 700, transition: 'color 0.2s' }}>/</span>
              <button
                onClick={fire}
                style={{
                  padding: '10px 20px',
                  background: input.trim() ? (patternLoaded ? 'linear-gradient(135deg, #cc9900, #ffcc00)' : `linear-gradient(135deg, ${stage === 'boss' ? '#b59500' : stage === 'combat' ? '#b5005a' : '#00a8b5'}, ${stageColor})`) : '#111',
                  border: 'none',
                  borderRadius: '6px',
                  color: input.trim() ? (stage === 'combat' ? '#fff' : '#06080f') : '#333',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '14px',
                  fontWeight: 800,
                  cursor: input.trim() ? 'pointer' : 'default',
                  letterSpacing: '2px',
                  transition: 'all 0.2s',
                }}
              >
                {patternLoaded ? '⏎ FIRE' : 'FIRE'}
              </button>
            </div>

            {error && (
              <div style={{ width: GAME_W, padding: '6px 0', fontSize: '14px', color: '#ff0040' }}>
                ⚠ {error}
              </div>
            )}

            {/* Match preview counter */}
            {previewRegex && !error && (() => {
              const active = strings.filter(s => !s.destroyed);
              const enemyMatches = active.filter(s => s.isEnemy && previewRegex.test(s.text)).length;
              const friendlyMatches = active.filter(s => !s.isEnemy && previewRegex.test(s.text)).length;
              return (enemyMatches > 0 || friendlyMatches > 0) ? (
                <div style={{ width: GAME_W, padding: '4px 0', fontSize: '14px', display: 'flex', gap: '16px' }}>
                  {enemyMatches > 0 && (
                    <span style={{ color: '#00f0ff' }}>⎯ {enemyMatches} enem{enemyMatches === 1 ? 'y' : 'ies'} targeted</span>
                  )}
                  {friendlyMatches > 0 && (
                    <span style={{ color: '#ff0080' }}>⚠ {friendlyMatches} friendl{friendlyMatches === 1 ? 'y' : 'ies'} in crosshairs!</span>
                  )}
                </div>
              ) : null;
            })()}

            <div style={{
              width: GAME_W,
              display: 'flex',
              justifyContent: 'space-between',
              padding: '8px 0',
              fontSize: '13px',
              color: '#334',
            }}>
              <span>Patterns fired: {patternsFired}{patternHistory.length > 0 ? ` · History: ${patternHistory.length}` : ''}</span>
              <span>
                {patternLoaded
                  ? '⏎ refire · esc clear · ↑↓ history'
                  : patternHistory.length > 0
                    ? '⏎ fire · ↑ recall last pattern'
                    : '⏎ fire'
                }
              </span>
            </div>
          </div>

          {/* Cheat Sheet sidebar */}
          {cheatSheetPanel}
        </div>
      )}

      {/* LEVEL COMPLETE (not for boss) */}
      {phase === 'levelComplete' && currentLevel && levelScore && stage !== 'boss' && (
        <div style={{ textAlign: 'center', animation: 'entryFade 0.5s ease' }}>
          <div style={{
            fontFamily: "'Orbitron', sans-serif",
            fontSize: '32px',
            fontWeight: 900,
            color: stageColor,
            marginBottom: '6px',
          }}>
            LEVEL CLEARED
          </div>
          <div style={{ color: '#667', marginBottom: '30px', fontSize: '16px' }}>
            {stageIcon} {currentLevel.name} — {currentLevel.concept}
          </div>

          <div style={{ marginBottom: '24px' }}>
            {[1, 2, 3].map(s => (
              <span key={s} className={`star ${s <= getStars(levelScore.elapsed, patternsFired, currentLevel) ? 'lit' : ''}`}>
                ★
              </span>
            ))}
          </div>

          <div style={{
            background: '#0a1225',
            border: '1px solid #1a2a3a',
            borderRadius: '8px',
            padding: '20px 40px',
            display: 'inline-block',
            textAlign: 'left',
            marginBottom: '30px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '60px', marginBottom: '10px' }}>
              <span style={{ color: '#667' }}>Time</span>
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatTime(levelScore.elapsed)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ color: '#667' }}>Patterns Used</span>
              <span>{patternsFired}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ color: '#667' }}>Enemies</span>
              <span>{currentLevel.enemies.length}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ color: '#667' }}>Time Bonus</span>
              <span style={{ color: '#ffcc00' }}>+{levelScore.timeBonus}</span>
            </div>
            <div style={{ borderTop: '1px solid #1a2a3a', paddingTop: '10px', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: stageColor, fontWeight: 700 }}>Score</span>
              <span style={{ color: '#ffcc00', fontWeight: 700, fontSize: '18px' }}>{score + levelScore.timeBonus}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              onClick={resetGame}
              style={{
                padding: '10px 24px',
                background: 'transparent',
                border: '1px solid #333',
                borderRadius: '6px',
                color: '#667',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              MENU
            </button>
            <button
              onClick={() => {
                setScore(s => s + levelScore.timeBonus);
                startLevel(stage, levelIdx);
              }}
              style={{
                padding: '10px 24px',
                background: 'transparent',
                border: '1px solid #445',
                borderRadius: '6px',
                color: '#c8d6e5',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              REPLAY
            </button>
            {levelIdx < currentLevels.length - 1 && (
              <button
                onClick={() => {
                  setScore(s => s + levelScore.timeBonus);
                  startLevel(stage, levelIdx + 1);
                }}
                style={{
                  padding: '10px 24px',
                  background: `linear-gradient(135deg, ${stage === 'combat' ? '#b5005a' : '#00a8b5'}, ${stageColor})`,
                  border: 'none',
                  borderRadius: '6px',
                  color: stage === 'combat' ? '#fff' : '#06080f',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  letterSpacing: '1px',
                }}
              >
                NEXT LEVEL →
              </button>
            )}
          </div>
          <div style={{ marginTop: '16px', fontSize: '13px', color: '#334' }}>
            Press ENTER for {levelIdx < currentLevels.length - 1 ? 'next level' : 'replay'}
          </div>
        </div>
      )}

      {/* GAME OVER */}
      {phase === 'gameover' && (
        <div style={{ textAlign: 'center', animation: 'entryFade 0.5s ease' }}>
          <div style={{
            fontFamily: "'Orbitron', sans-serif",
            fontSize: '40px',
            fontWeight: 900,
            color: '#ff0080',
            marginBottom: '8px',
          }}>
            {stage === 'boss' ? 'DEFEATED' : 'SYSTEM BREACH'}
          </div>
          <div style={{ color: '#667', marginBottom: '30px', fontSize: '16px' }}>
            {stage === 'boss' ? (
              <>💀 Survived {bossWave + 1} wave{bossWave > 0 ? 's' : ''} · {formatTime(levelTime)}</>
            ) : (
              <>{stageIcon} {stage && stage !== 'boss' ? STAGES[stage]?.name : ''} — {currentLevel?.name}</>
            )}
          </div>

          <div style={{
            background: '#0a1225',
            border: '1px solid #1a2a3a',
            borderRadius: '8px',
            padding: '20px 40px',
            display: 'inline-block',
            marginBottom: '30px',
            textAlign: 'left',
          }}>
            {stage === 'boss' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '60px', marginBottom: '10px' }}>
                  <span style={{ color: '#667' }}>Waves</span>
                  <span>{bossWave + 1}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ color: '#667' }}>Time</span>
                  <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatTime(levelTime)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ color: '#667' }}>Patterns</span>
                  <span>{patternsFired}</span>
                </div>
                <div style={{ borderTop: '1px solid #1a2a3a', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ color: '#ffcc00', fontWeight: 700 }}>Score</span>
                  <span style={{ color: '#ffcc00', fontWeight: 700, fontSize: '18px' }}>{score}</span>
                </div>
                <div style={{ borderTop: '1px solid #1a2a3a', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px' }}>
                  <span style={{ color: '#556' }}>High Score</span>
                  <span style={{ color: '#556' }}>Wave {Math.max(bossHighWave, bossWave + 1)} · {Math.max(bossHighScore, score)}pts</span>
                </div>
                {(score > bossHighScore || bossWave + 1 > bossHighWave) && (
                  <div style={{ textAlign: 'center', color: '#ffcc00', fontSize: '14px', fontWeight: 700, letterSpacing: '2px', marginTop: '8px', animation: 'pulse 1s infinite' }}>
                    ★ NEW RECORD! ★
                  </div>
                )}
              </>
            )}
            {stage !== 'boss' && (
              <>
                <div style={{ fontSize: '16px', color: '#667', marginBottom: '8px', textAlign: 'center' }}>FINAL SCORE</div>
                <div style={{ fontSize: '36px', fontWeight: 800, color: '#ffcc00', textAlign: 'center' }}>{score}</div>
              </>
            )}
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              onClick={resetGame}
              style={{
                padding: '10px 24px',
                background: 'transparent',
                border: '1px solid #333',
                borderRadius: '6px',
                color: '#667',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              MENU
            </button>
            <button
              onClick={() => {
                if (stage === 'boss') {
                  startBoss();
                } else {
                  setLives(5); livesRef.current = 5; startLevel(stage, levelIdx);
                }
              }}
              style={{
                padding: '10px 24px',
                background: stage === 'boss'
                  ? 'linear-gradient(135deg, #b59500, #ffcc00)'
                  : 'linear-gradient(135deg, #ff0060, #ff0080)',
                border: 'none',
                borderRadius: '6px',
                color: stage === 'boss' ? '#06080f' : '#fff',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '13px',
                fontWeight: 800,
                cursor: 'pointer',
                letterSpacing: '1px',
              }}
            >
              {stage === 'boss' ? 'AGAIN' : 'RETRY'}
            </button>
          </div>
          <div style={{ marginTop: '16px', fontSize: '13px', color: '#334' }}>
            Press ENTER to {stage === 'boss' ? 'play again' : 'retry'}
          </div>
        </div>
      )}
    </div>
  );
}
