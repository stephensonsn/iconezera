# Listagem no Adobe Exchange (Developer Distribution)

Portal: https://developer.adobe.com/distribute/ → **Create new listing → Plugin**. Pacote: `apps/powerpoint/dist/downloads/iconezera-photoshop.ccx` (gerado por `npm run build:prod`; também publicado em https://stephensonsn.github.io/iconezera/downloads/iconezera-photoshop.ccx). Ícones da listagem: `docs/assets/exchange-icon-512.png` e `exchange-icon-1024.png`.

## Campos

| Campo | Valor |
|---|---|
| Nome | iconeZERA |
| Categoria | Icons / Design assets |
| Preço | Free |
| Compatibilidade | Photoshop 24.0+ (macOS e Windows) |
| Site | https://stephensonsn.github.io/iconezera/ |
| Privacidade | https://stephensonsn.github.io/iconezera/privacy.html |
| Suporte | https://stephensonsn.github.io/iconezera/#suporte |
| Licença | MIT (código); ícones sob as licenças de cada coleção |

## Português

**Resumo:** Busque em qualquer idioma e insira ícones SVG gratuitos como Smart Object vetorial.

**Descrição:**
O iconeZERA coloca mais de 200 mil ícones open source dentro do Photoshop. Digite o que procura, dê Enter e clique: o ícone entra como Smart Object vetorial, centralizado, na cor e no tamanho que você escolheu.

• Busca em qualquer idioma — o painel começa no idioma do seu Photoshop e você troca quando quiser.
• Cor: amostras, código hex ou a cor de primeiro plano atual.
• Tamanho em pixels, definido antes de inserir.
• Selecione uma camada de texto e abra o painel: o texto vira a busca.
• Só coleções cuja licença dispensa crédito ao autor (MIT, Apache 2.0, ISC, CC0 e similares) — use em trabalhos comerciais sem preocupação.
• Gratuito, sem conta, sem anúncios, sem rastreamento.

Os ícones são fornecidos pelo projeto open source Iconify. Termos em outros idiomas são traduzidos para inglês pelo serviço MyMemory; veja a política de privacidade.

## English

**Summary:** Search in any language and insert free SVG icons as vector Smart Objects.

**Description:**
iconeZERA brings 200,000+ open source icons into Photoshop. Type what you need, press Enter and click: the icon lands as a centered vector Smart Object, in the color and pixel size you picked.

• Search in any language — the panel starts in your Photoshop language and you can switch anytime.
• Color: swatches, hex code or the current foreground color.
• Size in pixels, set before inserting.
• Select a text layer and open the panel: its text becomes your search.
• Only collections whose license requires no attribution (MIT, Apache 2.0, ISC, CC0 and similar) — safe for commercial work.
• Free. No account, no ads, no tracking.

Icons are provided by the open source Iconify project. Non-English terms are translated to English by the MyMemory service; see the privacy policy.

## Notas para o revisor

No sign-in or license key is required. Open any document, then Plugins → iconeZERA. Type `rocket`, press Enter, click an icon: a vector Smart Object is placed at the center of the canvas at the size shown in the bottom bar. Use the color swatches to change the icon color. Network calls: api.iconify.design (icon search/data, with mirrors api.simplesvg.com / api.unisvg.com) and api.mymemory.translated.net (query translation). The plugin writes only to its own temporary folder.

## Pendências

- [ ] Capturas de tela do painel dentro do Photoshop (tamanho conforme o formulário).
- [ ] Teste no Windows.
- [ ] Confirmar no Photoshop: tamanho em px, camada de texto → busca, tema claro.
