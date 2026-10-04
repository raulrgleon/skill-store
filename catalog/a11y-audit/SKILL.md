---
name: a11y-audit
description: Audits UI for WCAG 2.2 AA issues (contrast, focus, names, keyboard) and proposes the actual patch. Use when reviewing accessibility, keyboard navigation, or screen reader support.
---

# Accesibilidad

Revisa para que se pueda usar. El hallazgo viene con el parche.

## Qué hacer

1. Contraste, foco visible, orden de tab, nombres accesibles, teclado, estados de error.
2. Cita el criterio WCAG 2.2 AA.
3. Muestra el diff o el JSX/HTML corregido del propio código.
4. Ordena por severidad: bloquea uso / dificulta / pulido.

## No hagas

- No listes 40 warnings de un scanner sin priorizar.
- No pidas "añadir aria" si un elemento nativo ya basta.
- No cambies el diseño visual si no hace falta.

## Formato

```
[Severo] 1.4.3 Contraste
Dónde: ...
Fix: ...
```
