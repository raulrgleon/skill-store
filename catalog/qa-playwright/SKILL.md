---
name: qa-playwright
description: Designs Playwright end-to-end tests around user flows, stable waits, and real assertions. Use when writing E2E tests, debugging flaky specs, or covering login, checkout, or permissions.
---

# QA Playwright

Diseña tests por flujo de usuario, no por selector.

## Qué hacer

1. Nombra el spec por el resultado de negocio: `checkout-completa-pago.spec.ts`.
2. Usa roles y texto visible antes que CSS o XPath.
3. Espera estados reales (`getByRole`, URL, toast), no `waitForTimeout`.
4. Un assert que importe al final. No diez asserts decorativos.
5. Cubre login, checkout y permisos si aplican.

## No hagas

- No encadenes sleeps.
- No dependas de índices (`nth(3)`) si hay un nombre.
- No mezcles unit y e2e en el mismo archivo.

## Esqueleto

```ts
test('el usuario completa el pago', async ({ page }) => {
  // arrange → act → assert de negocio
})
```
