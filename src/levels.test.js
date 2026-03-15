import { describe, it, expect } from 'vitest';

// Since levels are defined inside the component file, we duplicate the solutions here
// and test that each regex matches all enemies and no friendlies.

const TRAINING_SOLUTIONS = [
  { name: 'Boot Sequence', pattern: /bug|error|crash|fault|glitch|panic/,
    enemies: ['bug', 'error', 'crash', 'fault', 'glitch', 'panic'], friendlies: [] },
  { name: 'Pattern Recognition', pattern: /.at/,
    enemies: ['cat', 'bat', 'hat', 'rat', 'sat', 'mat', 'fat', 'pat'], friendlies: [] },
  { name: 'Signal & Noise', pattern: /^[a-f]\d$/,
    enemies: ['a1', 'b2', 'c3', 'd4', 'e5', 'f6'], friendlies: ['ab', 'cd', 'ef', 'gh'] },
  { name: 'Overflow', pattern: /[bg]o{2,}/,
    enemies: ['goo', 'gooo', 'goooo', 'gooooo', 'boo', 'booo', 'boooo'], friendlies: ['go', 'bo', 'no'] },
  { name: 'Border Control', pattern: /^pre/,
    enemies: ['pre_fix', 'pre_load', 'pre_set', 'pre_view', 'pre_heat'], friendlies: ['compress', 'express', 'repress', 'depress'] },
  { name: 'Double Agent', pattern: /ca[^ue]/,
    enemies: ['cat', 'car', 'cap', 'cab', 'can', 'cam'], friendlies: ['cup', 'cut', 'cub', 'cur', 'cue'] },
  { name: 'Data Stream', pattern: /^user_\d+$/,
    enemies: ['user_001', 'user_042', 'user_100', 'user_999', 'user_007'], friendlies: ['admin_001', 'root_042', 'guest_100', 'user'] },
  { name: 'Escape Room', pattern: /^price:\$\d+\.\d+$/,
    enemies: ['price:$9.99', 'price:$14.50', 'price:$3.00', 'price:$29.99', 'price:$0.50'], friendlies: ['price:free', 'price:TBD', 'cost:$9.99', 'price$9.99'] },
  { name: 'Word Boundaries', pattern: /\b(cat|dog|rat|bat)\b/,
    enemies: ['cat', 'dog', 'rat', 'bat'], friendlies: ['catch', 'catalog', 'dogma', 'rattle', 'battle', 'combat'] },
  { name: 'Repeat Offender', pattern: /(\w)\1/,
    enemies: ['aardvark', 'eel', 'balloon', 'coffee', 'toffee', 'committee'], friendlies: ['arena', 'blue', 'cake', 'desire', 'forge', 'tiger'] },
  { name: 'Final Firewall', pattern: /^err_2024-\d{2}$/,
    enemies: ['err_2024-01', 'err_2024-02', 'err_2024-03', 'err_2024-11', 'err_2024-12'], friendlies: ['log_2024-01', 'log_2024-02', 'err_2023-01', 'err_202401', '2024-01_err'] },
  { name: 'Future Sight', pattern: /\d+(?=px)/,
    enemies: ['100px', '24px', '8px', '320px', '50px', '16px'], friendlies: ['100em', '24rem', '8pt', '320vh', '50vw', '16%'] },
];

const COMBAT_SOLUTIONS = [
  { name: 'Perimeter Scan', pattern: /^ALERT-\d{3}$/,
    enemies: ['ALERT-001', 'ALERT-042', 'ALERT-199', 'ALERT-300', 'ALERT-577', 'ALERT-800', 'ALERT-999', 'ALERT-123'],
    friendlies: ['ALERT-1', 'ALERT-02', 'ALERT-1000', 'NOTICE-001', 'NOTICE-042', 'WARN-199'] },
  { name: 'Decoy Swarm', pattern: /^#[0-9a-f]{6}$/,
    enemies: ['#ff0000', '#00ff00', '#0000ff', '#ff8800', '#aa33cc', '#112233', '#deed00'],
    friendlies: ['#gg0000', '#ff000', '#ff00000', 'ff0000', '#FF0000', '#zz1122', '#12345'] },
  { name: 'Infiltration', pattern: /^HTTP\/[45]\d\d$/,
    enemies: ['HTTP/404', 'HTTP/500', 'HTTP/502', 'HTTP/503', 'HTTP/401', 'HTTP/403', 'HTTP/408', 'HTTP/429'],
    friendlies: ['HTTP/200', 'HTTP/201', 'HTTP/301', 'HTTP/304', 'FTP/404', 'TCP/500', 'HTTP/99'] },
  { name: 'Minefield', pattern: /^v2\.\d\.\d$/,
    enemies: ['v2.0.0', 'v2.1.0', 'v2.2.0', 'v2.0.1', 'v2.1.1', 'v2.2.1', 'v2.3.0', 'v2.3.1'],
    friendlies: ['v1.0.0', 'v3.0.0', 'v2.0', 'v2.0.0.1', 'v20.0', 'v2_0_0', 'v2.10.0'] },
  { name: 'Ghost Protocol', pattern: /^port:\d{4,}:open$/,
    enemies: ['port:3306:open', 'port:5432:open', 'port:6379:open', 'port:8080:open', 'port:9090:open', 'port:27017:open'],
    friendlies: ['port:22:open', 'port:80:open', 'port:443:open', 'port:3306:closed', 'port:5432:filtered', 'svc:8080:open'] },
  { name: 'Scorched Earth', pattern: /^rc-2\.\d\.\d$/,
    enemies: ['rc-2.0.1', 'rc-2.0.2', 'rc-2.1.0', 'rc-2.1.1', 'rc-2.2.0', 'rc-2.2.1'],
    friendlies: ['rc-1.0.0', 'rc-3.0.0', 'beta-2.0.1', 'alpha-2.1.0', 'rc-2.0', 'rc-2.0.1.1'] },
  { name: 'Final Assault', pattern: /^2026-\d{2}-err-(HIGH|CRIT)$/,
    enemies: ['2026-03-err-HIGH', '2026-04-err-HIGH', '2026-05-err-HIGH', '2026-03-err-CRIT', '2026-04-err-CRIT', '2026-05-err-CRIT', '2026-06-err-HIGH', '2026-06-err-CRIT', '2026-07-err-HIGH', '2026-07-err-CRIT'],
    friendlies: ['2026-03-err-LOW', '2026-03-err-MED', '2026-03-warn-HIGH', '2025-03-err-HIGH', '2026-03-log-CRIT', '2026-03-err-high', '2026-04-warn-CRIT'] },
];

function testSolution(level) {
  describe(level.name, () => {
    it('matches all enemies', () => {
      for (const enemy of level.enemies) {
        expect(level.pattern.test(enemy), `expected "${level.pattern}" to match enemy "${enemy}"`).toBe(true);
      }
    });

    if (level.friendlies.length > 0) {
      it('does not match any friendlies', () => {
        for (const friendly of level.friendlies) {
          expect(level.pattern.test(friendly), `expected "${level.pattern}" NOT to match friendly "${friendly}"`).toBe(false);
        }
      });
    }
  });
}

describe('Training level solutions', () => {
  TRAINING_SOLUTIONS.forEach(testSolution);
});

describe('Combat level solutions', () => {
  COMBAT_SOLUTIONS.forEach(testSolution);
});

describe('tryRegex equivalent', () => {
  it('valid pattern returns a regex', () => {
    const pattern = '^test$';
    const regex = new RegExp(pattern);
    expect(regex.test('test')).toBe(true);
    expect(regex.test('testing')).toBe(false);
  });

  it('invalid pattern throws', () => {
    expect(() => new RegExp('[')).toThrow();
  });
});
