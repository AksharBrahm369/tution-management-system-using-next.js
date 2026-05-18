export function generateExamCode(): string {
  const year = new Date().getFullYear();
  const randomStr = Math.random().toString(36).substring(2, 5).toUpperCase();
  const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `EXM-${year}-${randomStr}${randomNum}`;
}
