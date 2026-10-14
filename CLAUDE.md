# iconeZERA — regras do projeto

- **Nunca dar `git push` sem `npm run lint && npm test && npm run build:prod` passando.** O hook `.githooks/pre-push` força isso (ativado por `npm install` via `prepare`). Não contornar com `--no-verify`.
- **Nunca deixar o manifest de desenvolvimento (localhost:3000) instalado no PowerPoint.** Após `npm run sideload`, encerrar com `npm run sideload:stop` (reinstala o de produção). Para reinstalar a qualquer hora: `npm run manifest:prod`.
- Depois de cada push, conferir que o deploy passou: `gh run list --limit 1` deve mostrar `success`. Deploy falho = site parado na versão antiga sem aviso.
- UI segue o design system do host (Fluent 2 no PowerPoint, Spectrum no Photoshop).
