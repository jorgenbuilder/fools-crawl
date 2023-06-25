import React, { useEffect, useState } from "react";

type TypewriterProps = {
  string: string;
  delay?: number;
  onType?: () => void;
  onComplete?: () => void;
  interrupt?: boolean;
};

export default function Typewriter({
  string,
  delay = 10,
  onType = () => {},
  onComplete = () => {},
  interrupt = false,
}: TypewriterProps) {
  const [visibleChars, setVisibleChars] = useState(0);
  const typingTimeout = React.useRef<number>();

  // Reset text when a new string is received
  useEffect(() => {
    setVisibleChars(0);
  }, [string]);

  useEffect(() => {
    if (interrupt) {
      setVisibleChars(string.length);
      onComplete();
      return;
    }

    if (visibleChars < string.length) {
      typingTimeout.current = window.setTimeout(() => {
        setVisibleChars(visibleChars + 1);
        onType();
      }, delay);
    } else {
      onComplete();
    }

    return () => clearTimeout(typingTimeout.current);
  }, [visibleChars, interrupt]);

  return (
    <div>
      {string.slice(0, visibleChars)}
      <span style={{ visibility: "hidden" }}>{string.slice(visibleChars)}</span>
    </div>
  );
}
