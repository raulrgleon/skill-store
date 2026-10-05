#!/bin/sh
set -e

# Llave de despliegue (solo este repositorio, con permiso de escritura) para que el panel
# pueda guardar cambios en GitHub. Viene de la variable DEPLOY_KEY (base64) de Coolify.
if [ -n "$DEPLOY_KEY" ]; then
  mkdir -p /root/.ssh
  printf '%s' "$DEPLOY_KEY" | base64 -d > /root/.ssh/id_ed25519
  chmod 600 /root/.ssh/id_ed25519
  cat > /root/.ssh/config <<CONF
Host github.com
  HostName github.com
  User git
  IdentityFile /root/.ssh/id_ed25519
  IdentitiesOnly yes
  StrictHostKeyChecking yes
  UserKnownHostsFile /etc/ssh/ssh_known_hosts
CONF
  chmod 600 /root/.ssh/config
  export SKILLSTORE_REMOTE="${SKILLSTORE_REMOTE:-git@github.com:raulrgleon/skill-store.git}"
fi
unset DEPLOY_KEY

exec node --experimental-strip-types --no-warnings server/prod.ts
