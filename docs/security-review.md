# Revisão de segurança — iconeZERA

**Data:** 17/09/2026 · **Método:** skill `secure-code` (white-box; black-box após o deploy) · **Escopo:** `packages/core`, `apps/powerpoint`, CI/CD, dependências.

## Contexto
Front-end estático (TypeScript + Vite) hospedado no GitHub Pages, carregado como painel pelo PowerPoint. **Não há** backend, banco, autenticação, pagamentos, uploads, segredos ou cookies — a maior parte dos vetores (RLS, IDOR, JWT, webhooks, rate limit de IA, race conditions) não se aplica. A superfície real é: conteúdo de terceiros (SVG do Iconify, texto do MyMemory), a permissão `ReadWriteDocument` no documento do usuário e a cadeia de suprimentos.

## Resultado

| # | Vetor | Situação | Evidência |
|---|---|---|---|
| 1 | Segredos no código/histórico | ✅ Nenhum | grep por chaves/tokens sem resultado; repositório sem histórico anterior; `.env*` no `.gitignore` |
| 2 | XSS via SVG de terceiros | ✅ Mitigado | SVG só é exibido em `<img src="data:…">` (nunca `innerHTML`); grep por `innerHTML/outerHTML/insertAdjacentHTML/eval/new Function` sem ocorrências |
| 3 | XSS via texto de terceiros (tradução) | ✅ Mitigado | tudo entra por `textContent`/`URLSearchParams`; resposta do tradutor limitada a 80 caracteres |
| 4 | CSP | ✅ Aplicada no build | `default-src 'none'`, scripts só `'self'` + CDN do Office, `connect-src` restrito aos hosts de `services.json`; testado: script inline e `fetch` para outro host são bloqueados |
| 5 | Token em localStorage | ✅ N/A | só idioma e cache de traduções; nenhum dado sensível |
| 6 | Hosts configuráveis (`services.json`) | ✅ Validado | só origens `https:` sem credenciais/caminho, 1–5 itens; coberto por teste |
| 7 | Dependências | ✅ 0 vulnerabilidades | `npm audit` limpo após atualizar `vitest`/`vite` e forçar `adm-zip ≥ 0.6.1` (ferramental da Microsoft, só dev); produção tem 2 dependências (`@iconify/utils`, `@iconify/types`), ambas do mantenedor oficial |
| 8 | CI/CD | ✅ | Actions fixadas por SHA, `permissions: {}` por padrão, `persist-credentials: false`, `npm ci --ignore-scripts`, auditoria + lint + testes antes do deploy |
| 9 | Artefatos expostos | ✅ | sem source maps; `dist` contém só HTML/CSS/JS/PNG/manifest |
| 10 | Permissão no documento | ✅ Mínima necessária | lê apenas o texto selecionado (≤ 3 palavras) e escreve apenas o ícone clicado |
| 11 | `target=_blank` | ✅ | todos com `rel="noopener"`; `referrer: no-referrer` |

## Riscos aceitos (não corrigíveis no código)
- **`office.js` sem SRI** — a Microsoft exige carregá-lo do CDN dela e o arquivo muda sem versão fixa; SRI quebraria o add-in. Mitigado pela CSP restrita a esse host.
- **`style-src 'unsafe-inline'`** — o `office.js` injeta estilos inline. Scripts inline continuam bloqueados.
- **Termo de busca vai a terceiros** (Iconify, MyMemory) — inerente ao produto; declarado na política de privacidade.
- **CSP via `<meta>`** — GitHub Pages não permite cabeçalhos; `frame-ancestors`, HSTS e `nosniff` ficam por conta do GitHub (HSTS é aplicado por ele). Migrar para Cloudflare Pages permitiria cabeçalhos próprios.
- **E-mail de contato público** no painel e nas páginas — decisão do autor; sujeito a spam.
