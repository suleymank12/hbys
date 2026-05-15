/**
 * Türkiye Cumhuriyeti kimlik numarası checksum algoritması.
 * 1) Tam 11 hane, yalnız rakam, ilk hane 0 olamaz.
 * 2) Tek sıralı hanelerin (1,3,5,7,9) toplamının 7 katından çift sıralı
 *    hanelerin (2,4,6,8) toplamı çıkarılır → mod 10 = 10. hane.
 * 3) İlk 10 hanenin toplamının mod 10'u = 11. hane.
 */
export function validateTcKimlik(tc: string): boolean {
  if (!tc || tc.length !== 11) return false;

  const digits = new Array<number>(11);
  for (let i = 0; i < 11; i++) {
    const code = tc.charCodeAt(i) - 48;
    if (code < 0 || code > 9) return false;
    digits[i] = code;
  }

  if (digits[0] === 0) return false;

  const oddSum = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
  const evenSum = digits[1] + digits[3] + digits[5] + digits[7];

  let tenthCheck = (oddSum * 7 - evenSum) % 10;
  if (tenthCheck < 0) tenthCheck += 10;
  if (tenthCheck !== digits[9]) return false;

  let firstTenSum = 0;
  for (let i = 0; i < 10; i++) firstTenSum += digits[i];
  const eleventhCheck = firstTenSum % 10;
  if (eleventhCheck !== digits[10]) return false;

  return true;
}
