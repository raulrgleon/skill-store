---
name: code-review
description: Reviews pull requests for real risk, missing tests, and API contracts. Use when reviewing a PR, a diff, or when the user asks for a code review.
---

# Code Review

Comenta como un lead: riesgos reales, no nitpicks de estilo si el linter ya cubre eso.

## Qué hacer

1. Resume el cambio en 2 frases.
2. Busca: regresiones, contratos rotos, auth, datos, tests faltantes, nombres que mienten.
3. Agrupa comentarios por archivo. Un hallazgo por comentario.
4. Separa Bloqueantes / Mejoras / Nit.
5. Propón el parche o el test, no solo el problema.

## No hagas

- No reescribas el PR por gusto personal.
- No dupliques lo que ya dice el linter.
- No pidas "más comentarios" en código que ya se entiende.

## Formato de comentario

```
Riesgo: ...
Por qué importa: ...
Sugerencia: ...
```
