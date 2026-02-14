import React, { useEffect, useState } from "react";

export default function TimeZone({ user }) {
  // Track current time
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update the time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Format the date
  const formatDateAndTime = (date, timeZone) => {
    const options = {
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
      ...(timeZone ? { timeZone } : {}),
    };

    return new Intl.DateTimeFormat(undefined, options).format(date);
  };

  const otherFormatted =
    user && user.timezone
      ? formatDateAndTime(currentTime, user.timezone)
      : null;

  return (
    <div>
      {user && (
        <div className="text-sm">
          Time: {otherFormatted ? otherFormatted : "No time zone found"}
        </div>
      )}
    </div>
  );
}
