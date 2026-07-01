import { Link } from "@tanstack/react-router";

// Converts #hashtag and @mention into clickable React elements
export function parseText(text: string): React.ReactNode[] {
  const parts = text.split(/(#[\w\u00C0-\u017F]+|@[\w.]+)/g);
  return parts.map((part, i) => {
    if (part.startsWith("#")) {
      return (
        <Link key={i} to="/search" search={{ q: part }} className="text-[#25F4EE] hover:underline">
          {part}
        </Link>
      );
    }
    if (part.startsWith("@")) {
      const username = part.slice(1);
      return (
        <Link
          key={i}
          to="/profile/$username"
          params={{ username }}
          className="text-[#25F4EE] hover:underline"
        >
          {part}
        </Link>
      );
    }
    return part;
  });
}
