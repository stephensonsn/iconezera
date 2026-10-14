# iconeZERA — regras do projeto

- **Nunca dar `git push` sem `npm run lint && npm test && npm run build:prod` passando.** O hook `.githooks/pre-push` força isso (ativado por `npm install` via `prepare`). Não contornar com `--no-verify`.
- **Nunca deixar o manifest de desenvolvimento (localhost:3000) instalado no PowerPoint.** Após `npm run sideload`, encerrar com `npm run sideload:stop` (reinstala o de produção). Para reinstalar a qualquer hora (com o PowerPoint fechado): `npm run manifest:prod` — ele também limpa o cache do Office (`…/Office/16.0/Wef/*/Manifests/<ID>_<versão>`), que guarda o manifest por ID+versão e ignora o arquivo novo se a versão não mudar.
- Depois de cada push, conferir que o deploy passou: `gh run list --limit 1` deve mostrar `success`. Deploy falho = site parado na versão antiga sem aviso.
- UI segue o design system do host (Fluent 2 no PowerPoint, Spectrum no Photoshop).
- `apps/powerpoint/manifest.xml` é SEMPRE o manifest de desenvolvimento (localhost:3000, versão x.y.z.0). O de produção é gerado em `dist/` (versão x.y.z.100). `npm run sideload` cria o arquivo do PowerPoint como **hardlink** desse manifest — nunca gravar por cima dele (`curl -o`/`cp`) sem `rm` antes, senão o repositório muda junto. `npm run manifest:prod` já faz isso certo.
