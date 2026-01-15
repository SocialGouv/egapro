const fs = require('fs');
const path = require('path');

const dsfrDir = path.join(__dirname, '../node_modules/@codegouvfr/react-dsfr/dsfr');
const publicDsfrDir = path.join(__dirname, '../public/dsfr');

if (fs.existsSync(publicDsfrDir)) {
  fs.rmSync(publicDsfrDir, { recursive: true, force: true });
}

fs.cpSync(dsfrDir, publicDsfrDir, { recursive: true });

const cssPath = path.join(publicDsfrDir, 'dsfr.min.css');
let cssContent = fs.readFileSync(cssPath, 'utf8');

// Regex robuste pour remplacer les URLs des fonts et icons
// Capture : url( [espace] ["']? (fonts|icons)/nom-fichier.svg ["']? [#frag]? )
// Préserve les fragments (#id) pour les sprites SVG
cssContent = cssContent.replace(/url\s*\(\s*(["']?)(fonts|icons)\/([^"')]+)(["']?)(#[\w-]+)?\s*\)/gi, (match, quote1, type, filename, quote2, fragment) => {
  const newQuote = quote1 || quote2 || '';
  const newFragment = fragment || '';
  return `url(${newQuote}/dsfr/${type}/${filename}${newQuote}${newFragment})`;
});

fs.writeFileSync(cssPath, cssContent);

console.log('DSFR assets copied and CSS paths updated to public/dsfr/');