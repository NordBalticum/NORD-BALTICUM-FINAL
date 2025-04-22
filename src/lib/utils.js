// src/lib/utils.js

export function cn(...args) {
  return args.filter(Boolean).join(" ");
}
