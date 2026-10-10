import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';

export function Screen({ children, title }: { children: ReactNode; title?: string }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-4 px-4 py-6">
      {title && <h1 className="text-2xl font-semibold leading-tight">{title}</h1>}
      {children}
    </main>
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' };

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  const look = variant === 'primary' ? 'bg-button text-button-text' : 'bg-secondary-bg text-text';
  return (
    <button
      className={`w-full rounded-2xl px-4 py-3 text-base font-medium transition-opacity disabled:opacity-50 ${look} ${className}`}
      {...props}
    />
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className="w-full rounded-2xl bg-secondary-bg px-4 py-3 text-base text-text outline-none placeholder:text-hint"
      {...props}
    />
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl bg-secondary-bg p-4 ${className}`}>{children}</div>;
}

export function Hint({ children }: { children: ReactNode }) {
  return <p className="text-sm text-hint">{children}</p>;
}

export function Loading() {
  return (
    <Screen>
      <Hint>Минутку…</Hint>
    </Screen>
  );
}

export function ErrorNote({ children = 'Что-то пошло не так. Попробуй ещё раз чуть позже.' }) {
  return <p className="text-sm text-hint">{children}</p>;
}
