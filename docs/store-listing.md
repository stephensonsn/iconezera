# Listagem no AppSource (Partner Center)

Textos prontos para colar em **Marketplace offers → Office Add-in**. Manifest a enviar: `apps/powerpoint/dist/manifest.xml` (gerado por `npm run build:prod`; também publicado em https://stephensonsn.github.io/iconezera/manifest.xml).

## URLs

| Campo | Valor |
|---|---|
| Privacy policy | https://stephensonsn.github.io/iconezera/privacy.html |
| Support | https://stephensonsn.github.io/iconezera/#suporte |
| Website | https://stephensonsn.github.io/iconezera/ |
| EULA | usar o *Standard Contract* da Microsoft |

## Categorias
Productivity · Design (secundária: Education). Preço: **Free**. Produtos: PowerPoint (Windows, Mac, Web).

## Português (Brasil)

**Nome:** iconeZERA

**Resumo (até 100 caracteres):**
Busque em qualquer idioma e insira ícones SVG gratuitos direto no slide.

**Descrição:**
O iconeZERA coloca mais de 200 mil ícones open source dentro do PowerPoint. Digite o que procura, dê Enter e clique: o ícone entra no slide como SVG editável, pronto para recolorir ou converter em forma.

• Busca em qualquer idioma — o painel começa no idioma do seu Office e você troca no globo quando quiser.
• Selecione uma palavra no slide e abra o painel: ela vira a busca.
• Só coleções cuja licença dispensa crédito ao autor (MIT, Apache 2.0, ISC, CC0 e similares) — use em apresentações comerciais sem preocupação.
• Gratuito, sem conta, sem anúncios, sem rastreamento.

Os ícones são fornecidos pelo projeto open source Iconify. Termos em outros idiomas são traduzidos para inglês pelo serviço MyMemory; veja a política de privacidade.

**Palavras-chave:** ícones, icons, svg, pictogramas, design

## English (United States)

**Name:** iconeZERA

**Summary (max 100 chars):**
Search in any language and insert free SVG icons straight into your slide.

**Description:**
iconeZERA brings 200,000+ open source icons into PowerPoint. Type what you need, press Enter and click: the icon lands on your slide as an editable SVG, ready to recolor or convert to a shape.

• Search in any language — the panel starts in your Office language and you can switch it from the globe button.
• Select a word on the slide, open the panel, and it becomes your search.
• Only collections whose license requires no attribution (MIT, Apache 2.0, ISC, CC0 and similar) — safe for commercial decks.
• Free. No account, no ads, no tracking.

Icons are provided by the open source Iconify project. Non-English terms are translated to English by the MyMemory service; see the privacy policy.

**Search keywords:** icons, svg, pictograms, symbols, design

## Notas de teste para o revisor (Certification notes)

No sign-in or license key is required.
1. Open PowerPoint, go to **Home → iconeZERA**. The task pane opens.
2. Type `rocket` and press Enter. A grid of icons appears.
3. Click any icon: it is inserted into the current slide as an SVG image.
4. Type a word in a text box on the slide, select it, and the pane searches for it automatically.
5. Click the globe button (top right) to change the search language; e.g. choose *Français* and search `parapluie`.
The add-in calls api.iconify.design (icon search/data) and api.mymemory.translated.net (query translation). It reads only the selected text and writes only the clicked icon.

## Imagens

- Ícone da loja (300×300): `apps/powerpoint/public/assets/icon-300.png`.
- 1 a 5 capturas de tela 1366×768 (PNG) do painel **dentro do PowerPoint** — precisam ser feitas por você: tela inicial com sugestões, resultado de busca, ícone inserido no slide, menu de idiomas.

## Pendências fora do código

- [ ] Conta no Partner Center (programa *Microsoft 365 and Copilot*) — o nome do publicador verificado deve ser igual ao `<ProviderName>` do manifest (hoje `iconeZERA`). Se o Partner Center só aceitar seu nome legal, altere o `ProviderName` para o mesmo valor antes de enviar.
- [ ] Testar o painel publicado no PowerPoint para Windows, Mac e Web.
- [ ] Capturas de tela.
