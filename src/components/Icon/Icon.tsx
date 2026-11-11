
export type IconName =
  | 'helix'
  | 'centrifuge'
  | 'virus'
  | 'syringe'
  | 'snow'
  | 'pea'
  | 'lock'
  | 'check'
  | 'back'
  | 'close'
  | 'warning'
  | 'arrow';

const PATHS: Record<IconName, JSX.Element> = {
  helix: (
    <>
      <path d="M14 3 L23.5 8.5 V19.5 L14 25 L4.5 19.5 V8.5 Z" />
      <circle cx="14" cy="14" r="4" />
      <circle cx="14" cy="14" r="1.2" fill="currentColor" />
    </>
  ),
  centrifuge: (
    <>
      <circle cx="14" cy="14" r="11" />
      <circle cx="14" cy="14" r="2" />
      <circle cx="14" cy="7" r="2.2" />
      <circle cx="20" cy="17.5" r="2.2" />
      <circle cx="8" cy="17.5" r="2.2" />
    </>
  ),
  virus: (
    <>
      <path d="M14 3 L19 6 V11 L14 14 L9 11 V6 Z" />
      <path d="M14 14 V21" />
      <path d="M14 21 L8 26 M14 21 L20 26 M14 21 L11 26 M14 21 L17 26" />
    </>
  ),
  syringe: (
    <>
      <path d="M19 4 L24 9" />
      <path d="M21.5 6.5 L10 18 L7 21 L4 24" />
      <path d="M17 8 L20 11 M14 11 L17 14 M11 14 L14 17" />
      <path d="M16 7 L21 12" />
    </>
  ),
  snow: (
    <>
      <path d="M14 3 V25 M4.5 8.5 L23.5 19.5 M23.5 8.5 L4.5 19.5" />
      <path d="M11 5 L14 8 L17 5 M11 23 L14 20 L17 23" />
    </>
  ),
  pea: (
    <>
      <path d="M4 16 C4 9 10 6 14 6 C18 6 24 9 24 16 C20 22 8 22 4 16 Z" />
      <circle cx="9.5" cy="14.5" r="2.2" />
      <circle cx="14" cy="13.5" r="2.2" />
      <circle cx="18.5" cy="14.5" r="2.2" />
    </>
  ),
  lock: (
    <>
      <rect x="6" y="12" width="16" height="12" rx="2" />
      <path d="M9 12 V8.5 a5 5 0 0 1 10 0 V12" />
    </>
  ),
  check: <path d="M6 14.5 L11.5 20 L22 8" />,
  back: <path d="M17 6 L9 14 L17 22" />,
  close: <path d="M7 7 L21 21 M21 7 L7 21" />,
  warning: (
    <>
      <path d="M14 3 L26 24 H2 Z" />
      <path d="M14 11 V17 M14 20.5 V21" />
    </>
  ),
  arrow: <path d="M4 14 H23 M17 8 L23 14 L17 20" />,
};

interface Props {
  name: IconName;
  size?: number;
  className?: string;
  strokeWidth?: number;
}

export function Icon({ name, size = 24, className, strokeWidth = 1.8 }: Props) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name]}
    </svg>
  );
}
