import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = resolve(fileURLToPath(new URL('../../../../../', import.meta.url)));
const brandDir = resolve(root, 'docs/04-marca/activos/logo');
const webDir = resolve(root, 'apps/web/public/assets');
const ink = '#243A31';
const green = '#27664B';
const mint = '#9CE6BD';

// Left rounded ear suggests a dog; the pointed right ear suggests a cat.
// The shared face narrows into a destination marker. Face details are cutouts.
const markShape = `M64 18
  C51 18 41 23 34 33
  C24 29 14 31 11 41
  C8 51 12 67 19 75
  C22 79 27 80 31 77
  C35 96 48 108 64 120
  C84 105 101 85 101 60
  C107 53 112 43 110 31
  L106 13
  C105 9 101 9 99 13
  L90 33
  C83 23 75 18 64 18 Z
  M43 61 a5 5 0 1 0 10 0 a5 5 0 1 0 -10 0 Z
  M75 61 a5 5 0 1 0 10 0 a5 5 0 1 0 -10 0 Z
  M45 77 C49 87 56 93 64 93 C72 93 79 87 83 77
  C76 83 70 86 64 86 C58 86 52 83 45 77 Z`;

const mark = (color) => `<path fill="${color}" fill-rule="evenodd" d="${markShape}"/>`;

// Custom rounded lettering; no webfont or font installation is required.
const petLetters = `
  <path d="M169 99V34h28c16 0 25 9 25 22s-9 22-25 22h-28"/>
  <path d="M241 82h39c0-13-7-22-20-22s-21 9-21 22c0 13 9 21 22 21 8 0 14-3 19-8"/>
  <path d="M305 43v45c0 10 5 15 16 15M290 62h30"/>`;
const goLetters = `
  <path d="M405 47c-7-10-17-15-31-15-22 0-37 15-37 35s15 36 37 36c17 0 29-9 32-23V70h-28"/>
  <circle cx="449" cy="82" r="21"/>`;

function wordmark(petColor, goColor) {
  return `<g fill="none" stroke-width="11" stroke-linecap="round" stroke-linejoin="round">
    <g stroke="${petColor}">${petLetters}</g>
    <g stroke="${goColor}">${goLetters}</g>
  </g>`;
}

function svg(viewBox, title, description, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" role="img" aria-labelledby="title desc">
  <title id="title">${title}</title>
  <desc id="desc">${description}</desc>
  ${body}
</svg>\n`;
}

const files = {
  'petgo-horizontal.svg': svg('0 0 500 128', 'Logo PetGo', 'Símbolo animal con forma de destino y logotipo PetGo verde oscuro.', `${mark(ink)}${wordmark(ink, green)}`),
  'petgo-horizontal-monocromo.svg': svg('0 0 500 128', 'Logo PetGo monocromo', 'Versión de un solo color del símbolo y logotipo PetGo.', `${mark(ink)}${wordmark(ink, ink)}`),
  'petgo-horizontal-inverso.svg': svg('0 0 500 128', 'Logo PetGo inverso', 'Versión clara del símbolo y logotipo PetGo para fondo oscuro.', `${mark('#FAFCF8')}${wordmark('#FAFCF8', '#FAFCF8')}`),
  'petgo-simbolo.svg': svg('0 0 128 128', 'Símbolo PetGo', 'Cara amable de mascota con una oreja redondeada y otra puntiaguda; su silueta termina como marcador de destino.', mark(ink)),
  'petgo-simbolo-inverso.svg': svg('0 0 128 128', 'Símbolo PetGo inverso', 'Versión clara del símbolo PetGo para fondo oscuro.', mark('#FAFCF8')),
  'petgo-avatar.svg': svg('0 0 512 512', 'Avatar PetGo', 'Símbolo PetGo en verde oscuro sobre círculo menta.', `<circle cx="256" cy="256" r="256" fill="${mint}"/><g transform="translate(61 61) scale(3.05)">${mark(ink)}</g>`),
  'petgo-favicon.svg': svg('0 0 128 128', 'Favicon PetGo', 'Símbolo PetGo sobre fondo menta de esquinas redondeadas.', `<rect width="128" height="128" rx="30" fill="${mint}"/><g transform="translate(8 5) scale(.875)">${mark(ink)}</g>`),
  'petgo-presentacion.svg': svg('0 0 1200 840', 'Sistema de logo PetGo', 'Presentación de las versiones horizontal, inversa, monocroma, símbolo y avatar de PetGo.', `
    <rect width="1200" height="840" fill="#FAFCF8"/>
    <text x="52" y="77" fill="${ink}" font-family="Arial, sans-serif" font-size="36" font-weight="700">PetGo</text>
    <text x="54" y="107" fill="${green}" font-family="Arial, sans-serif" font-size="18">Sistema de logo · propuesta vectorial</text>
    <rect x="52" y="140" width="1096" height="242" rx="28" fill="#E5F6EB"/>
    <g transform="translate(114 158) scale(1.56)">${mark(ink)}${wordmark(ink, green)}</g>
    <rect x="52" y="414" width="530" height="254" rx="26" fill="${ink}"/>
    <text x="80" y="457" fill="#FAFCF8" font-family="Arial, sans-serif" font-size="17">SOBRE FONDO OSCURO</text>
    <g transform="translate(76 489) scale(.95)">${mark('#FAFCF8')}${wordmark('#FAFCF8', '#FAFCF8')}</g>
    <rect x="604" y="414" width="544" height="254" rx="26" fill="${mint}"/>
    <text x="632" y="457" fill="${ink}" font-family="Arial, sans-serif" font-size="17">AVATAR Y SÍMBOLO</text>
    <circle cx="731" cy="565" r="83" fill="#FAFCF8"/>
    <g transform="translate(655 486) scale(1.2)">${mark(ink)}</g>
    <g transform="translate(863 503) scale(1.13)">${mark(ink)}</g>
    <text x="52" y="723" fill="${green}" font-family="Arial, sans-serif" font-size="18">Una silueta · dos mascotas · un destino</text>
    <text x="52" y="761" fill="${ink}" font-family="Arial, sans-serif" font-size="17">SVG editable · sin fuentes externas · versiones a color, una tinta e inversa</text>
    <rect x="52" y="791" width="145" height="10" rx="5" fill="${mint}"/>
    <rect x="211" y="791" width="145" height="10" rx="5" fill="${ink}"/>
    <rect x="370" y="791" width="145" height="10" rx="5" fill="${green}"/>
  `),
};

await mkdir(brandDir, { recursive: true });
for (const [name, content] of Object.entries(files)) {
  await writeFile(resolve(brandDir, name), content);
}
await writeFile(resolve(webDir, 'petgo-horizontal.svg'), files['petgo-horizontal.svg']);
await writeFile(resolve(webDir, 'petgo-favicon.svg'), files['petgo-favicon.svg']);
console.log(`Generados ${Object.keys(files).length} SVG de marca y 2 copias para la web.`);
