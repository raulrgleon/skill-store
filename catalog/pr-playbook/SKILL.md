---
name: pr-playbook
description: Applies Nimbus pull request conventions for branch names, size, tests, and merge messages. Use when opening, reviewing, or merging a PR in this team.
---

# Playbook de PRs

Así mergea Nimbus.

## No negociable

- Rama: `tipo/ticket-corto` (`fix/login-redirect`).
- Un PR < 400 líneas. Si pasa, parte.
- Tests para el camino feliz y el error que ya rompió algo.
- Descripción: qué, por qué, cómo probarlo.
- No mergear con `WIP` ni con CI rojo.

## PR bueno

Título claro, 80 líneas, un test, GIF o pasos de QA.

## PR malo

"fixes", 900 líneas, sin test, "lgtm" como única review.

## Mensaje de merge

```
<tipo>: <qué cambió>

Por qué: ...
```
