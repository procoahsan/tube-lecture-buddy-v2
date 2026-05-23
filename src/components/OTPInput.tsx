"use client";
import { OTPInput as OTPInputPrimitive, SlotProps } from "input-otp";

interface OTPInputProps {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  disabled?: boolean;
}

function Slot(props: SlotProps) {
  return (
    <div
      className={`otp-slot ${props.isActive ? "otp-slot--active" : ""} ${
        props.char ? "otp-slot--filled" : ""
      }`}
    >
      <span className="otp-slot-char">{props.char ?? ""}</span>
      {props.hasFakeCaret && (
        <span className="otp-slot-caret">
          <span />
        </span>
      )}
    </div>
  );
}

export default function OTPInput({
  value,
  onChange,
  maxLength = 6,
  disabled = false,
}: OTPInputProps) {
  return (
    <OTPInputPrimitive
      maxLength={maxLength}
      value={value}
      onChange={onChange}
      disabled={disabled}
      containerClassName="otp-container"
      render={({ slots }) => (
        <div className="otp-group">
          {slots.slice(0, 3).map((slot, idx) => (
            <Slot key={idx} {...slot} />
          ))}
          <div className="otp-separator">
            <div className="otp-separator-dot" />
          </div>
          {slots.slice(3).map((slot, idx) => (
            <Slot key={idx + 3} {...slot} />
          ))}
        </div>
      )}
    />
  );
}
