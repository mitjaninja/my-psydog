import type { Practice } from '@prisma/client';
import type { PracticeDto } from '@psydog/shared';

export function toPracticeDto(p: Practice): PracticeDto {
  return {
    id: p.id,
    need: p.need,
    title: p.title,
    summary: p.summary,
    steps: p.steps as string[],
    inputType: p.inputType,
    durationMin: p.durationMin,
    isComforting: p.isComforting,
  };
}
