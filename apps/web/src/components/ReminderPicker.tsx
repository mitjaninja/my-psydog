const HOURS = [8, 9, 10, 12, 14, 17, 19, 20, 21, 22];

export function ReminderPicker(props: {
  value: number | null;
  onChange: (hour: number | null) => void;
}) {
  return (
    <select
      className="w-full rounded-2xl bg-secondary-bg px-4 py-3 text-base text-text"
      value={props.value ?? 'off'}
      onChange={(e) => props.onChange(e.target.value === 'off' ? null : Number(e.target.value))}
    >
      {HOURS.map((h) => (
        <option key={h} value={h}>
          {`${h}:00`}
        </option>
      ))}
      <option value="off">Без напоминаний</option>
    </select>
  );
}
