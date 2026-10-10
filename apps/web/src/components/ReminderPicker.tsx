import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const HOURS = [8, 9, 10, 12, 14, 17, 19, 20, 21, 22];
const OFF = 'off';

export function ReminderPicker(props: {
  id?: string;
  value: number | null;
  onChange: (hour: number | null) => void;
}) {
  return (
    <Select
      value={props.value === null ? OFF : String(props.value)}
      onValueChange={(v) => props.onChange(v === OFF ? null : Number(v))}
    >
      <SelectTrigger
        id={props.id}
        className="w-full rounded-xl bg-background text-base data-[size=default]:h-12"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {HOURS.map((h) => (
          <SelectItem key={h} value={String(h)}>
            {`${h}:00`}
          </SelectItem>
        ))}
        <SelectItem value={OFF}>Без напоминаний</SelectItem>
      </SelectContent>
    </Select>
  );
}
