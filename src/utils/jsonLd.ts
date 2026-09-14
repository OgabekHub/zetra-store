/**
 * JSON-LD ni `<script>` ichiga xavfsiz joylashtirish.
 *
 * `<`, `>` va `&` belgilari Unicode qochirish ketma-ketligiga aylantiriladi,
 * shunda ma'lumot ichidagi `</script>` HTML tahlilchisini chalg'itmaydi.
 * Next hujjatlari (`01-app/02-guides/json-ld.md`) aynan shuni talab qiladi.
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
}
