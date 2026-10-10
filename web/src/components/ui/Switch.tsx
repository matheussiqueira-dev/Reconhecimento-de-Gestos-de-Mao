"use client";

type SwitchProps = {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

export function Switch({ label, checked, onChange }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className="ms-switch"
      onClick={() => onChange(!checked)}
    >
      <span className="ms-switch__track" aria-hidden="true">
        <span className="ms-switch__thumb" />
      </span>
      <span>{label}</span>
      <span className="ms-switch__state" aria-hidden="true">
        {checked ? "Ativo" : "Inativo"}
      </span>
    </button>
  );
}
