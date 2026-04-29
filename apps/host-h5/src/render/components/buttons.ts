export type HostH5ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

export function renderButton(
  id: string,
  label: string,
  variant: HostH5ButtonVariant,
  disabled = false,
): string {
  return `<button id="${id}" class="me-button me-button-${variant}" ${disabled ? "disabled" : ""}>${label}</button>`;
}

export function renderFilterButton(id: string, label: string, active: boolean): string {
  return `<button id="${id}" class="me-filter-button ${active ? "me-filter-button-active" : ""}">${label}</button>`;
}
