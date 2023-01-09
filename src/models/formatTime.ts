export function formatTime(timestamp: number): string {
  const hour = Math.floor(timestamp / (60 * 60));
  const minute = Math.floor((timestamp - hour * 60 * 60) / 60);
  const second = timestamp - hour * 60 * 60 - minute * 60;

  let result = "";

  if (hour === 0 || hour === 12) {
    result = "12";
  } else if (hour < 12) {
    result = `${hour}`;
  } else {
    result = `${hour - 12}`;
  }

  if (minute > 0 || second > 0) {
    result += minute < 10 ? `:0${minute}` : `:${minute}`;
  }

  if (second > 0) {
    result += second < 10 ? `:0${second}` : `:${second}`;
  }

  result += hour < 12 ? ` AM` : ` PM`;

  return result;
}
