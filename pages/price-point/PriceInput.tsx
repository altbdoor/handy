import { useLayoutEffect, useRef, useState } from "react-compat";

type NumeralInputProps = {
  hasDecimals?: boolean;
  onChange: (value: number) => void;
  className?: string;
  autoFocus?: boolean;
};

const digitsOnly = (value: string) => value.replace(/\D/g, "");

const decimalFormatter = new Intl.NumberFormat(undefined, {
  style: "decimal",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const intFormatter = new Intl.NumberFormat(undefined, {
  style: "decimal",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function NumeralInput({
  hasDecimals = true,
  onChange,
  className,
  autoFocus = false,
}: NumeralInputProps) {
  const [displayVal, setDisplayVal] = useState("");
  const ref = useRef<HTMLInputElement>(null);
  const divisor = hasDecimals ? 100 : 1;
  const placeholder = hasDecimals ? "0.00" : "0";

  useLayoutEffect(() => {
    if (autoFocus) {
      ref.current?.focus();
    }
  }, [autoFocus]);

  return (
    <input
      ref={ref}
      className={className}
      inputMode="numeric"
      pattern="[0-9]*"
      placeholder={placeholder}
      value={displayVal}
      onChange={(event) => {
        const digits = digitsOnly(event.target.value);
        if (digits.length === 0) {
          onChange(0);
          setDisplayVal("");
          return;
        }

        const rawNumber = Number(digits);
        const value = rawNumber / divisor;
        onChange(value);

        const nextDisplay = (
          hasDecimals ? decimalFormatter : intFormatter
        ).format(value);
        setDisplayVal(nextDisplay);
      }}
    />
  );
}
