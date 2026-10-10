import { PrismaClient, type InputType, type Need } from '@prisma/client';

// TODO: проверка схема-терапевтом — все тексты практик ниже черновые.

interface PracticeSeed {
  id: string;
  need: Need;
  title: string;
  summary: string;
  steps: string[];
  inputType: InputType;
  durationMin: number;
  isComforting: boolean;
}

export const practices: PracticeSeed[] = [
  {
    id: 'safe-place',
    need: 'SAFETY',
    title: 'Безопасное место',
    summary: 'Побудь немного с малышом там, где ему спокойно и тепло.',
    steps: [
      'Устройся поудобнее и сделай пару медленных вдохов.',
      'Представь место, где тебе спокойно: настоящее или придуманное.',
      'Рассмотри его: какие там цвета, звуки, запахи, что под ногами.',
      'Пригласи туда малыша и побудь с ним рядом, пока идёт таймер.',
    ],
    inputType: 'TIMER',
    durationMin: 5,
    isComforting: true,
  },
  {
    id: 'letter-to-little-me',
    need: 'SAFETY',
    title: 'Письмо малышу',
    summary: 'Несколько тёплых слов малышу внутри от тебя сегодняшнего.',
    steps: [
      'Вспомни себя в детстве — любой возраст, который приходит первым.',
      'Подумай, что этому малышу хотелось бы услышать.',
      'Напиши ему письмо так, как написал бы добрый взрослый.',
      'Перечитай письмо медленно, как будто его получаешь ты.',
    ],
    inputType: 'TEXT',
    durationMin: 10,
    isComforting: true,
  },
  {
    id: 'comfort-phrase',
    need: 'SAFETY',
    title: 'Тёплая фраза себе',
    summary: 'Одна короткая фраза, которая поддержит тебя сегодня.',
    steps: [
      'Заметь, как ты сейчас себя чувствуешь.',
      'Подбери фразу, которую сказал бы тебе близкий человек.',
      'Запиши её и произнеси про себя пару раз.',
    ],
    inputType: 'TEXT',
    durationMin: 3,
    isComforting: true,
  },
  {
    id: 'small-step',
    need: 'AUTONOMY',
    title: 'Маленький шаг',
    summary: 'Выбери одно крошечное дело, которое приблизит тебя к важному.',
    steps: [
      'Подумай о чём-то, что для тебя сейчас важно.',
      'Найди самый маленький шаг в эту сторону — такой, что займёт пару минут.',
      'Запиши, какой шаг ты выбираешь.',
      'Если захочется, сделай его прямо сейчас.',
    ],
    inputType: 'TEXT',
    durationMin: 5,
    isComforting: false,
  },
  {
    id: 'what-worked',
    need: 'AUTONOMY',
    title: 'Что сегодня получилось',
    summary: 'Собери небольшой список того, что у тебя сегодня вышло.',
    steps: [
      'Пройдись мысленно по сегодняшнему дню.',
      'Запиши всё, что получилось, даже самые простые вещи.',
      'Выбери одно и побудь немного с приятным чувством от него.',
    ],
    inputType: 'LIST',
    durationMin: 5,
    isComforting: false,
  },
  {
    id: 'my-choice',
    need: 'AUTONOMY',
    title: 'Мой выбор сегодня',
    summary: 'Заметь один выбор, который сегодня был твоим.',
    steps: [
      'Вспомни момент сегодня, когда выбор был за тобой.',
      'Запиши, что это был за выбор и чем он был важен для тебя.',
      'Отметь, каково это — решать самому.',
    ],
    inputType: 'TEXT',
    durationMin: 3,
    isComforting: false,
  },
  {
    id: 'emotion-diary',
    need: 'EXPRESSION',
    title: 'Дневник эмоций',
    summary: 'Расскажи малышу, какие чувства были сегодня.',
    steps: [
      'Вспомни момент дня, который отозвался чувством.',
      'Назови это чувство одним-двумя словами.',
      'Опиши, где оно ощущалось в теле.',
      'Запиши, что это чувство, возможно, хотело тебе сказать.',
    ],
    inputType: 'TEXT',
    durationMin: 7,
    isComforting: false,
  },
  {
    id: 'name-the-need',
    need: 'EXPRESSION',
    title: 'Назвать потребность',
    summary: 'Послушай, чего тебе сейчас хочется на самом деле.',
    steps: [
      'Остановись и спроси себя: «Чего мне сейчас хочется?»',
      'Попробуй найти потребность за этим желанием — отдых, тепло, свобода, внимание.',
      'Запиши её простыми словами.',
    ],
    inputType: 'TEXT',
    durationMin: 5,
    isComforting: false,
  },
  {
    id: 'ask-for-it',
    need: 'EXPRESSION',
    title: 'Попросить о своём',
    summary: 'Маленькая просьба о том, что тебе нужно.',
    steps: [
      'Выбери одну небольшую вещь, которая тебе сейчас нужна.',
      'Подумай, кого можно о ней попросить.',
      'Сформулируй просьбу коротко и по-доброму.',
      'Когда почувствуешь, что момент подходящий, — попроси.',
    ],
    inputType: 'CHECKLIST',
    durationMin: 5,
    isComforting: false,
  },
  {
    id: 'ten-min-joy',
    need: 'PLAY',
    title: '10 минут радости',
    summary: 'Десять минут чего-то приятного просто так, без пользы.',
    steps: [
      'Выбери что-то, что приносит тебе удовольствие.',
      'Запусти таймер и дай себе это время целиком.',
      'Если всплывут мысли о делах, мягко возвращайся к радости.',
    ],
    inputType: 'TIMER',
    durationMin: 10,
    isComforting: true,
  },
  {
    id: 'childhood-joy',
    need: 'PLAY',
    title: 'Что радовало в детстве',
    summary: 'Вспомни, от чего в детстве у тебя загорались глаза.',
    steps: [
      'Вспомни себя в детстве в хороший день.',
      'Запиши игры, вещи и занятия, которые тебя радовали.',
      'Отметь одно, что можно попробовать снова, хотя бы чуть-чуть.',
    ],
    inputType: 'LIST',
    durationMin: 5,
    isComforting: true,
  },
  {
    id: 'silly-thing',
    need: 'PLAY',
    title: 'Немного глупостей',
    summary: 'Разреши себе что-нибудь лёгкое и немного несерьёзное.',
    steps: [
      'Выбери что-нибудь смешное: потанцевать, скорчить рожицу, напеть песенку.',
      'Сделай это, даже если немного неловко.',
      'Заметь, что изменилось внутри.',
    ],
    inputType: 'CHECKLIST',
    durationMin: 5,
    isComforting: false,
  },
  {
    id: 'say-no',
    need: 'LIMITS',
    title: 'Сказать «нет»',
    summary: 'Побереги свои силы одним спокойным «нет».',
    steps: [
      'Вспомни, где тебе хотелось бы сказать «нет».',
      'Подумай, что ты бережёшь этим «нет» — время, силы, покой.',
      'Запиши, как можно сказать это мягко и ясно.',
    ],
    inputType: 'TEXT',
    durationMin: 5,
    isComforting: false,
  },
  {
    id: 'pause-impulse',
    need: 'LIMITS',
    title: 'Пауза перед импульсом',
    summary: 'Пара минут тишины между желанием и действием.',
    steps: [
      'Заметь импульс, который хочется сразу выполнить.',
      'Запусти таймер и просто подыши, не действуя.',
      'Когда таймер закончится, спроси себя, чего тебе хочется сейчас.',
    ],
    inputType: 'TIMER',
    durationMin: 3,
    isComforting: false,
  },
  {
    id: 'enough-for-today',
    need: 'LIMITS',
    title: 'На сегодня достаточно',
    summary: 'Разреши себе остановиться — на сегодня сделано достаточно.',
    steps: [
      'Отметь, что сегодня уже сделано.',
      'Выбери, какие дела можно спокойно оставить на потом.',
      'Скажи себе: «На сегодня достаточно».',
    ],
    inputType: 'CHECKLIST',
    durationMin: 3,
    isComforting: true,
  },
  {
    id: 'critic-shield',
    need: 'SAFETY',
    title: 'Защитить малыша от критика',
    summary: 'Встань между малышом и строгим внутренним голосом.',
    steps: [
      'Заметь, что сейчас говорит внутренний критик.',
      'Представь, что он говорит это малышу, а ты стоишь рядом.',
      'Запиши, что ты ответишь критику, чтобы защитить малыша.',
      'Скажи малышу что-нибудь тёплое от себя.',
    ],
    inputType: 'TEXT',
    durationMin: 7,
    isComforting: true,
  },
];

/** upsert — сид можно запускать повторно, правки текстов подтягиваются. */
export async function seedPractices(prisma: PrismaClient) {
  for (const p of practices) {
    await prisma.practice.upsert({ where: { id: p.id }, create: p, update: p });
  }
}

async function main() {
  const prisma = new PrismaClient();
  try {
    await seedPractices(prisma);
    const count = await prisma.practice.count();
    console.log(`Практик в БД: ${count}`);
  } finally {
    await prisma.$disconnect();
  }
}

// Запуск как скрипта (prisma db seed), а не при импорте из тестов
if (import.meta.url === `file://${process.argv[1]}`) await main();
