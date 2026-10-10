import type { Mood } from '@psydog/shared';
import './character.css';

const LINE = 'var(--character-line)';

function Eyes({ mood }: { mood: Mood }) {
  if (mood === 'HIDING') return null; // глаза под лапками
  if (mood === 'JOYFUL') {
    // Радостные глаза-дужки
    return (
      <g fill="none" stroke={LINE} strokeWidth="5" strokeLinecap="round">
        <path d="M66 98 q12 -14 24 0" />
        <path d="M110 98 q12 -14 24 0" />
      </g>
    );
  }
  const r = mood === 'SCARED' ? 13 : 15;
  const pupil = mood === 'SCARED' ? 6 : 10;
  return (
    <g>
      {[78, 122].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy="98" r={r} fill="#fff" />
          <circle cx={cx} cy="100" r={pupil} fill={LINE} />
          <circle cx={cx + 3} cy="95" r="3.2" fill="#fff" />
        </g>
      ))}
    </g>
  );
}

function Mouth({ mood }: { mood: Mood }) {
  const common = { fill: 'none', stroke: LINE, strokeWidth: 4, strokeLinecap: 'round' as const };
  switch (mood) {
    case 'JOYFUL':
      return (
        <path
          d="M86 122 q14 16 28 0 z"
          fill={LINE}
          stroke={LINE}
          strokeWidth="3"
          strokeLinejoin="round"
        />
      );
    case 'SCARED':
      return <path d="M90 128 q5 -4 10 0 q5 4 10 0" {...common} />;
    case 'HIDING':
      return <path d="M93 126 q7 6 14 0" {...common} />;
    default:
      return <path d="M90 124 q10 9 20 0" {...common} />;
  }
}

function Arms({ mood, waving }: { mood: Mood; waving: boolean }) {
  const paw = { fill: 'var(--character-body)', stroke: 'var(--character-shade)', strokeWidth: 2 };
  if (mood === 'HIDING') {
    // Лапки прикрывают глаза
    return (
      <g {...paw}>
        <ellipse cx="80" cy="98" rx="20" ry="15" transform="rotate(-15 80 98)" />
        <ellipse cx="120" cy="98" rx="20" ry="15" transform="rotate(15 120 98)" />
      </g>
    );
  }
  if (mood === 'SCARED') {
    // Лапки прижаты к телу
    return (
      <g {...paw}>
        <ellipse cx="62" cy="130" rx="11" ry="15" transform="rotate(15 62 130)" />
        <ellipse cx="138" cy="130" rx="11" ry="15" transform="rotate(-15 138 130)" />
      </g>
    );
  }
  const raised = mood === 'JOYFUL' && !waving;
  return (
    <g {...paw}>
      <ellipse
        cx={raised ? 42 : 46}
        cy={raised ? 108 : 132}
        rx="11"
        ry="16"
        transform={raised ? 'rotate(35 42 108)' : 'rotate(20 46 132)'}
      />
      <g className={waving ? 'ch-arm-wave' : undefined}>
        <ellipse
          cx={raised || waving ? 158 : 154}
          cy={raised || waving ? 104 : 132}
          rx="11"
          ry="16"
          transform={raised || waving ? 'rotate(-35 158 104)' : 'rotate(-20 154 132)'}
        />
      </g>
    </g>
  );
}

/**
 * Персонаж «Малыш»: круглое существо без пола и возраста.
 * Цвет тела — CSS-переменная --character-body.
 */
export function Character({
  mood = 'CALM',
  size = 160,
  waving = false,
  className = '',
}: {
  mood?: Mood;
  size?: number;
  waving?: boolean;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      className={`character mx-auto block ${className}`}
      data-mood={mood}
      role="img"
      aria-label="Малыш"
    >
      <ellipse
        className="ch-shadow"
        cx="100"
        cy="186"
        rx="52"
        ry="7"
        fill="var(--character-line)"
        opacity="0.15"
      />
      <g className="ch-figure">
        {/* Ножки */}
        <g fill="var(--character-body)" stroke="var(--character-shade)" strokeWidth="2">
          <ellipse cx="78" cy="176" rx="15" ry="9" />
          <ellipse cx="122" cy="176" rx="15" ry="9" />
        </g>
        {/* Ушки-бугорки */}
        <g fill="var(--character-body)">
          <circle cx="62" cy="58" r="14" />
          <circle cx="138" cy="58" r="14" />
        </g>
        {/* Тело */}
        <circle cx="100" cy="112" r="68" fill="var(--character-body)" />
        <ellipse cx="100" cy="140" rx="40" ry="32" fill="var(--character-belly)" />
        {/* Щёчки */}
        <g fill="var(--character-cheek)" opacity={mood === 'SCARED' ? 0.35 : 0.6}>
          <ellipse cx="62" cy="118" rx="10" ry="6" />
          <ellipse cx="138" cy="118" rx="10" ry="6" />
        </g>
        <Eyes mood={mood} />
        <Mouth mood={mood} />
        <Arms mood={mood} waving={waving} />
      </g>
    </svg>
  );
}
