export function getSubsequentPageTopMarginStyle(pagePaddingY: number, marginY: number): string | null {
  const effectivePaddingY = pagePaddingY > 0 ? pagePaddingY : marginY;
  if (effectivePaddingY <= 0) return null;

  return `
    @page { margin-top: ${effectivePaddingY}pt; }
    @page :first { margin-top: 0; }
  `;
}
