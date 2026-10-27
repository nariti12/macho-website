const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const jsx = (type, props) => ({ type, props });
function render(page, query) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(root, 'src/components/torecha-localized-legal.tsx'), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText, { exports, URLSearchParams, window: { location: { search: query } }, require(name) {
    if (name === 'react') return { useSyncExternalStore: (_, snapshot) => snapshot() };
    if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx };
    if (name === '@/components/torecha-page-shell') return { TorechaPageShell: 'Shell' };
    if (name === '@/lib/torecha-legal-translations.json') return JSON.parse(fs.readFileSync(path.join(root, 'src/lib/torecha-legal-translations.json'), 'utf8'));
    throw new Error(name);
  } });
  const fallback = { japanese: true };
  return { tree: exports.TorechaLocalizedLegal({ page, children: fallback }), fallback };
}
function nodes(tree) { return !tree || typeof tree !== 'object' ? [] : Array.isArray(tree) ? tree.flatMap(nodes) : [tree, ...nodes(tree.props?.children)]; }
test('legal pages select English and Korean full text without replacing the Japanese fallback', () => {
  for (const page of ['privacy', 'terms']) {
    for (const query of ['', '?lang=ja', '?lang=fr', '?lang=%3Cscript%3E']) {
      const r = render(page, query); assert.equal(r.tree, r.fallback);
    }
    for (const language of ['en', 'ko']) {
      const r = render(page, '?lang=' + language); const all = nodes(r.tree);
      assert.equal(all.find(n => n.type === 'main').props.lang, language);
      const html = all.find(n => n.props?.dangerouslySetInnerHTML).props.dangerouslySetInnerHTML.__html;
      assert.ok(html.includes('<h1>') && html.length > 2000);
      assert.ok(html.includes(language === 'en' ? 'Subscription' : '구독') || (page === 'privacy' && html.includes(language === 'en' ? 'subscription' : '구매')));
      assert.ok(!html.includes('<script'));
    }
  }
});

test('translated legal copy retains all current Japanese policy sections and deletion deadlines', () => {
  for (const language of ['en', 'ko']) {
    for (const [page, headings] of [['privacy', 12], ['terms', 13], ['delete-account', 4]]) {
      const html = nodes(render(page, '?lang=' + language).tree).find(n => n.props?.dangerouslySetInnerHTML).props.dangerouslySetInnerHTML.__html;
      assert.equal((html.match(/<h2>/g) || []).length, headings, page);
      if (page !== 'terms') { assert.ok(html.includes('30')); assert.ok(html.includes('90')); }
      if (page === 'terms') assert.ok(html.includes('Google Play'));
    }
  }
});

test('translated policies retain the existing website contact form and use the visible message label', () => {
  for (const lang of ['en', 'ko']) {
    for (const page of ['privacy', 'terms']) {
      const html = nodes(render(page, '?lang=' + lang).tree).find(n => n.props?.dangerouslySetInnerHTML).props.dangerouslySetInnerHTML.__html;
      assert.ok(html.includes('href="/contact"'), page + ' ' + lang + ' contact link');
    }
    const html = nodes(render('delete-account', '?lang=' + lang).tree).find(n => n.props?.dangerouslySetInnerHTML).props.dangerouslySetInnerHTML.__html;
    assert.ok(html.includes('メッセージ'));
  }
});

test('legal footer links retain the selected language and default links remain Japanese', () => {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(root, 'src/components/torecha-page-shell.tsx'), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText, { exports, require(name) {
    if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx };
    if (name === 'next/link') return { __esModule: true, default: 'Link' };
    if (name === 'next/image') return { __esModule: true, default: 'Image' };
    throw new Error(name);
  } });
  for (const language of [undefined, 'ja', 'en', 'ko']) {
    const links = nodes(exports.TorechaPageShell({ children: null, language })).filter(n => n.type === 'Link').map(n => n.props.href);
    for (const page of ['privacy', 'terms']) assert.ok(links.includes('/apps/torecha/' + page + (language && language !== 'ja' ? '?lang=' + language : '')));
  }
  for (const lang of ['en', 'ko']) assert.equal(render('privacy', '?lang=' + lang).tree.props.language, lang);
});
