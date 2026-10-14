#!/bin/sh
# Instala no PowerPoint para Mac o manifest de PRODUÇÃO (painel servido do GitHub Pages).
# Use depois de `npm run sideload:stop`, ou sempre que o painel disser que "não é possível carregar o suplemento".
set -e
WEF="$HOME/Library/Containers/com.microsoft.Powerpoint/Data/Documents/wef"
ID="ab8ca183-6879-43ab-8660-fc1c074fac3f"
mkdir -p "$WEF"
curl -fsSL https://stephensonsn.github.io/iconezera/manifest.xml -o "$WEF/$ID.manifest.xml"
grep -q "localhost" "$WEF/$ID.manifest.xml" && { echo "ERRO: manifest baixado ainda aponta para localhost"; exit 1; }
echo "Manifest de produção instalado em $WEF. Feche o PowerPoint (Cmd+Q) e abra de novo."
