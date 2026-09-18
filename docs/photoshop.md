# iconeZERA para Photoshop (UXP)

Plugin de painel para Photoshop 2026 e Photoshop (Beta). Um único pacote serve às duas versões (mínimo: Photoshop 24, out/2022). Reutiliza `packages/core`; a interface segue o Spectrum (design system da Adobe) e acompanha o tema do Photoshop.

## O que faz
- Busca em qualquer idioma (mesmo motor do PowerPoint, mesmo seletor de idioma).
- Ícone entra como **Smart Object vetorial**, centralizado, com 25% do menor lado do documento, na **cor de primeiro plano** atual (ícones multicoloridos mantêm as cores).
- Se a camada ativa for de texto (até 3 palavras), o conteúdo dela vira a busca ao abrir o painel e ao trocar de camada.

## Rodar em desenvolvimento
1. No app Creative Cloud, instale o **UXP Developer Tool** (Todos os aplicativos → UXP Developer Tool).
2. Gere o build:
   ```bash
   npm run build:ps
   ```
3. Abra o UXP Developer Tool → **Add Plugin** → selecione `apps/photoshop/dist/manifest.json`.
4. Com o Photoshop aberto, clique em **Load**. O painel aparece em **Plug-ins → iconeZERA**.
5. Após mudar o código: `npm run build:ps` e, no UXP Developer Tool, **Reload**.

Para ver o painel num navegador comum (host simulado; o clique copia o SVG):
```bash
npm exec -w @iconezera/photoshop -- vite preview --port 3300
```

## Distribuir
- **Para testar com outras pessoas:** no UXP Developer Tool, **Package** gera um `.ccx`; dois cliques nele instalam pelo app Creative Cloud.
- **Adobe Exchange (loja, gratuito, aceita pessoa física):** https://exchange.adobe.com → Distribution Portal → criar listagem, enviar o `.ccx`, descrição, ícone e capturas. Revisão da Adobe leva alguns dias.

## Não verificado
O plugin foi validado apenas no navegador com host simulado. Dentro do Photoshop ainda precisam ser confirmados: a colocação do SVG via `placeEvent` (Smart Object vetorial e escala), a leitura da camada de texto e o evento `select`, o `localStorage` do UXP e a exibição de `<img>` com data URI.
