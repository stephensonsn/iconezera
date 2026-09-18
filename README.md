# iconeZERA

Complemento gratuito para **PowerPoint** (e, em breve, **Photoshop**): digite o que procura, dê Enter e insira ícones SVG open source direto no slide.

- 🔎 Busca em qualquer idioma: começa no idioma do Office e o globo 🌐 no topo permite trocar (a escolha fica salva)
- 🗣️ Interface em português, inglês e espanhol (demais idiomas usam inglês)
- ✍️ Selecione uma palavra no slide e abra o painel: ela vira a busca
- 🧩 O ícone entra como SVG editável (recolorir, *Converter em Forma*); cai para PNG em versões antigas do Office
- ⚖️ Só coleções cuja licença **dispensa crédito** (MIT, Apache-2.0, ISC, CC0, Unlicense, BSD-3-Clause, OFL-1.1)

Os ícones vêm da API pública do [Iconify](https://iconify.design) (200 mil+ ícones). Nada é hospedado por este projeto.

## Estrutura

| Pasta | O quê |
|---|---|
| `packages/core` | Cliente Iconify (busca, filtro de licença, download em lote, montagem do SVG) e dicionário PT→EN. Independente de host — será reutilizado no Photoshop. |
| `apps/powerpoint` | Add-in de painel de tarefas (Office.js + Vite). |
| `apps/photoshop` | Plugin UXP para Photoshop 2026/Beta (ver `docs/photoshop.md`). |
| `scripts/make-icons.py` | Gera os PNGs do ícone do add-in. |
| `services.json` | Servidores de ícones e de tradução. Trocar um host aqui atualiza o código **e** a CSP no próximo deploy — sem mexer em código. |
| `docs/` | Textos da loja (`store-listing.md`) e revisão de segurança (`security-review.md`). |

## Rodando no PowerPoint (desenvolvimento)

Requer Node 20+ e PowerPoint para Mac/Windows.

```bash
npm install
npm run certs      # uma vez: instala o certificado HTTPS local (pede a senha do sistema)
npm run sideload   # sobe o servidor em https://localhost:3000 e abre o PowerPoint com o add-in
```

No PowerPoint: **Página Inicial → iconeZERA**. Para encerrar: `npm run sideload:stop`.

Só para ver o painel num navegador comum (sem Office; o clique copia o SVG):

```bash
ICONEZERA_HTTP=1 npm run dev   # http://localhost:3000/taskpane.html
```

## Publicação

Cada push na `main` roda auditoria, lint e testes e publica `apps/powerpoint/dist` no GitHub Pages (`.github/workflows/deploy.yml`). `npm run build:prod` gera também `dist/manifest.xml` (URLs públicas, para o Partner Center — `docs/store-listing.md`) e `dist/downloads/iconezera-photoshop.ccx` (pacote do plugin, para o Adobe Exchange — `docs/exchange-listing.md`).

## Design

O painel segue o **Fluent 2**, design system da Microsoft (tokens de `@fluentui/tokens`: cores, raios de 4/6/8 px, sombras, curvas de movimento), e acompanha o tema claro/escuro do Office.

## Qualidade

```bash
npm test          # vitest
npm run lint      # tsc + eslint
npm run validate  # valida o manifest no serviço da Microsoft
```

## Notas técnicas

- **Limite da API:** pedir um `.svg` por ícone estoura o rate limit do Iconify (HTTP 429). Por isso o `core` baixa os dados em lote (`/{coleção}.json?icons=a,b,c`, uma requisição por coleção) e monta o SVG localmente; se um host falhar, tenta os espelhos oficiais (`api.simplesvg.com`, `api.unisvg.com`).
- **Tradução da busca:** o índice do Iconify é em inglês. Português usa o dicionário embutido (offline); o que ele não cobre e os demais idiomas vão para a API gratuita [MyMemory](https://mymemory.translated.net) (~5 mil caracteres/dia por usuário), com cache em `localStorage`. Se o tradutor falhar, a busca segue com o termo digitado. ⚠️ O termo buscado é enviado a esse serviço — isso precisa constar na política de privacidade ao publicar.
- **Cor:** PowerPoint não entende `currentColor`; o SVG é inserido em preto e pode ser recolorido no próprio PowerPoint.
- **Segurança:** o SVG de terceiros só é exibido via `<img src="data:…">`, nunca injetado como HTML do painel.

## Roadmap

1. ✅ Núcleo + add-in PowerPoint
2. ✅ Hospedagem no GitHub Pages + manifest de produção
3. Publicação no AppSource (pendente: conta no Partner Center e capturas de tela)
4. ✅ Plugin Photoshop (UXP) — pendente: teste no Photoshop e publicação no Adobe Exchange

## Licença

MIT. Os ícones pertencem aos respectivos autores, sob as licenças de cada coleção.
