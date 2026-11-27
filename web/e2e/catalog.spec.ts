import { createHmac } from 'node:crypto';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { expect, test, type Page } from '@playwright/test';

const admin = { username: 'admin@prueba.local', password: 'Admin123!' };
const manager = { username: 'manager@prueba.local', password: 'Manager123!' };

async function capture(page: Page, name: string) {
  const directory = process.env.E2E_SCREENSHOTS;
  if (!directory) return;
  await mkdir(directory, { recursive: true });
  await page.screenshot({ path: join(directory, name) });
}

async function login(page: Page, account: typeof admin) {
  await page.goto('/login');
  await expect(
    page.getByRole('heading', { name: 'Iniciar sesión' }),
  ).toBeVisible();
  await page.getByLabel('Usuario').fill(account.username);
  await page.getByLabel('Contraseña', { exact: true }).fill(account.password);
  const loginResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith('/api/session') &&
      response.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  const response = await loginResponse;
  expect(response.status()).toBe(204);
  await expect(page).toHaveURL(/\/products$/);
}

test('admin inicia sesión, consulta, crea, edita y confirma o cancela el borrado', async ({
  page,
  context,
  baseURL,
}) => {
  const name = 'Agua de prueba web';
  const edited = `${name} actualizada`;
  await page.goto('/login');
  await capture(page, '01-login.png');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await expect(page.getByText('Ingresa tu usuario.')).toBeVisible();
  await page.getByRole('button', { name: 'Mostrar contraseña' }).click();
  await expect(page.getByLabel('Contraseña', { exact: true })).toHaveAttribute(
    'type',
    'text',
  );
  await page.getByRole('button', { name: 'Ocultar contraseña' }).click();
  await login(page, admin);
  await expect(page.getByText('106 productos')).toBeVisible();
  await capture(page, '02-catalogo-admin.png');

  await expect(page.locator('tbody tr')).toHaveCount(20);
  for (let current = 2; current <= 6; current++) {
    await page.getByRole('button', { name: 'Siguiente' }).click();
    await expect(page.getByText(`Página ${current} de 6`)).toBeVisible();
  }
  await expect(page.locator('tbody tr')).toHaveCount(6);
  await expect(page.getByRole('button', { name: 'Siguiente' })).toBeDisabled();
  await page.getByLabel('Categoría', { exact: true }).selectOption('BEB');
  await expect(page.getByRole('button', { name: 'Anterior' })).toBeDisabled();
  await page.getByLabel('Categoría', { exact: true }).selectOption('');

  const firstRow = page.locator('tbody tr').first();
  await firstRow.getByRole('link').first().focus();
  await page.keyboard.press('Tab');
  await expect(firstRow.getByRole('link', { name: /^Editar / })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(
    firstRow.getByRole('button', { name: /^Eliminar / }),
  ).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(
    page.getByRole('dialog').getByRole('button', { name: 'Cancelar' }),
  ).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(
    firstRow.getByRole('button', { name: /^Eliminar / }),
  ).toBeFocused();

  await page.setViewportSize({ width: 390, height: 844 });
  const card = page
    .getByRole('list', { name: 'Productos', exact: true })
    .getByRole('listitem')
    .first();
  for (const field of [
    'UPC',
    'Categoría',
    'Subcategoría',
    'Fecha de alta',
    'Última modificación',
  ]) {
    await expect(card.getByText(field, { exact: true })).toBeVisible();
  }
  await expect(card.getByRole('link', { name: /^Editar / })).toBeVisible();
  await card.getByRole('button', { name: /^Eliminar / }).click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Cancelar' })
    .click();
  await capture(page, '06-catalogo-admin-movil.png');
  await page.setViewportSize({ width: 1440, height: 900 });

  const cookie = (await context.cookies()).find(
    ({ name }) => name === 'upc_session',
  );
  expect(cookie?.httpOnly).toBe(true);
  expect(cookie?.sameSite).toBe('Lax');
  expect(cookie?.path).toBe('/');
  const payload = JSON.parse(
    Buffer.from(cookie!.value.split('.')[1], 'base64url').toString('utf8'),
  );
  expect(cookie?.expires).toBeLessThanOrEqual(payload.exp);
  expect(
    await page.evaluate(() => ({
      readable: document.cookie.includes('upc_session'),
      local: localStorage.length,
      temporary: sessionStorage.length,
    })),
  ).toEqual({ readable: false, local: 0, temporary: 0 });

  await page.reload();
  await expect(page.getByText('106 productos')).toBeVisible();
  await page.getByRole('searchbox', { name: 'Buscar' }).fill('010433218194');
  await expect(page.getByText('1 de 106 productos')).toBeVisible();
  await page
    .getByRole('link', { name: 'Agua Mineral 1.5L', exact: true })
    .click();
  await expect(page.getByRole('heading', { name: 'Auditoría' })).toBeVisible();
  await expect(page.getByText('2026-03-10 15:20:00 UTC')).toBeVisible();
  await expect(page.getByText('mrivera', { exact: true })).toHaveCount(2);
  await capture(page, '03-detalle.png');
  await page.getByRole('link', { name: 'Volver a productos' }).click();
  await page.getByRole('link', { name: 'Nuevo producto' }).click();

  const save = page.getByRole('button', { name: 'Guardar producto' });
  const upc = page.getByLabel('UPC', { exact: true });
  await expect(upc).toHaveAccessibleDescription(
    /exactamente 12 dígitos.*comenzar con cero/,
  );
  const category = page.getByLabel('Categoría', { exact: true });
  const subcategory = page.getByLabel('Subcategoría', { exact: true });
  await expect(subcategory).toBeDisabled();
  await save.click();
  await expect(page.getByText('Ingresa una descripción.')).toBeVisible();
  await expect(
    page.getByText('Selecciona una categoría.', { exact: true }),
  ).toBeVisible();
  await upc.fill('ABC');
  await save.click();
  await expect(
    page.getByText('El UPC debe tener exactamente 12 dígitos ASCII.'),
  ).toBeVisible();

  await upc.fill('010433218194');
  await page.getByLabel('Descripción').fill(name);
  await category.selectOption('BEB');
  await subcategory.selectOption('BEB-AGU');
  const slowPath = '**/api/catalog/categories/LAC/subcategories';
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(slowPath, async (route) => {
    await pending;
    await route.continue().catch(() => {});
  });
  try {
    await category.selectOption('LAC');
    await expect(subcategory).toBeDisabled();
    await expect(subcategory).toHaveValue('');
    await category.selectOption('PAN');
    await subcategory.selectOption('PAN-TOR');
  } finally {
    release();
    await page.unroute(slowPath);
  }
  await expect(subcategory).toHaveValue('PAN-TOR');
  await expect(
    subcategory.locator('option', { hasText: 'LAC-LEC' }),
  ).toHaveCount(0);
  await save.click();
  await expect(
    page.getByText('El UPC ya existe en el catálogo.'),
  ).toBeVisible();

  await upc.fill('012345678906');
  try {
    await capture(page, '04-formulario.png');
    await save.click();
    await expect(page.getByText('Producto creado.')).toBeVisible();
    await expect(
      page.getByText('El dígito de control del UPC es incorrecto.', {
        exact: false,
      }),
    ).toBeVisible();
    await expect(page.getByText('107 productos')).toBeVisible();
    await page.getByRole('searchbox', { name: 'Buscar' }).fill(name);

    await page.getByRole('link', { name: `Editar ${name}` }).click();
    await expect(upc).toHaveValue('012345678906');
    await expect(category).toHaveValue('PAN');
    await expect(subcategory).toHaveValue('PAN-TOR');
    await page.getByLabel('Descripción').fill(edited);
    await save.click();
    await expect(page.getByText('Producto actualizado.')).toBeVisible();
    await page.getByRole('searchbox', { name: 'Buscar' }).fill(edited);
    await expect(
      page.getByRole('link', { name: edited, exact: true }),
    ).toBeVisible();

    const deleteButton = page.getByRole('button', {
      name: `Eliminar ${edited}`,
    });
    await deleteButton.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toContainText(edited);
    await expect(
      dialog.getByRole('button', { name: 'Cancelar' }),
    ).toBeFocused();
    await dialog.getByRole('button', { name: 'Cancelar' }).click();
    await expect(deleteButton).toBeVisible();
    await deleteButton.click();
    await dialog.getByRole('button', { name: 'Eliminar producto' }).click();
    await expect(page.getByText('Producto eliminado.')).toBeVisible();
    await page.getByRole('searchbox', { name: 'Buscar' }).fill('');
    await expect(page.getByText('106 productos')).toBeVisible();
    await expect(
      page.getByRole('link', { name: edited, exact: true }),
    ).toHaveCount(0);
  } finally {
    const response = await context.request.get('/api/catalog/products');
    if (response.ok()) {
      const products: {
        id: number;
        upcCode: string;
        upcDescription: string;
      }[] = await response.json();
      const leftover = products.find(
        (product) =>
          product.upcCode === '012345678906' &&
          [name, edited].includes(product.upcDescription),
      );
      if (leftover)
        await context.request
          .delete(`/api/catalog/products/${leftover.id}`, {
            headers: { Origin: new URL(baseURL!).origin },
          })
          .then((response) => expect(response.status()).toBe(204));
    }
  }
  await page.getByRole('button', { name: 'Cerrar sesión' }).click();
  await expect(page).toHaveURL(/\/login$/);
  expect(
    (await context.cookies()).some(({ name }) => name === 'upc_session'),
  ).toBe(false);
  await page.goto('/products');
  await expect(page).toHaveURL(/\/login$/);
});

test('manager consulta en móvil, reintenta una falla de red y carece de permisos de escritura', async ({
  page,
  context,
  baseURL,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page, manager);
  await expect(page.getByText('106 productos')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    390,
  );
  await capture(page, '05-catalogo-manager-movil.png');

  await page.route('**/api/catalog/products', (route) => route.abort(), {
    times: 1,
  });
  await page.reload();
  await expect(page.getByText(/No se pudo conectar/)).toBeVisible();
  await page.getByRole('button', { name: 'Reintentar' }).click();
  await expect(page.getByText('106 productos')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Nuevo producto' })).toHaveCount(
    0,
  );
  await expect(page.getByRole('link', { name: /^Editar / })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /^Eliminar / })).toHaveCount(0);

  const detail = page.getByRole('link', {
    name: 'Agua Mineral 1.5L',
    exact: true,
  });
  const path = await detail.getAttribute('href');
  await detail.click();
  await expect(page.getByRole('heading', { name: 'Auditoría' })).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Editar', exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Eliminar', exact: true }),
  ).toHaveCount(0);

  for (const forbidden of ['/products/new', `${path}/edit`]) {
    await page.goto(forbidden);
    await expect(page).toHaveURL(/\/products\?forbidden=1$/);
    await expect(
      page.getByText('Tu rol solo permite consultar productos.'),
    ).toBeVisible();
  }
  const response = await context.request.post('/api/catalog/products', {
    headers: { Origin: new URL(baseURL!).origin },
    data: {
      upcCode: '012345678905',
      upcDescription: 'No permitido',
      categoryCode: 'BEB',
      subCategoryCode: 'BEB-AGU',
    },
  });
  expect(response.status()).toBe(403);
  expect((await response.json()).code).toBe('FORBIDDEN');
  await page.getByRole('button', { name: 'Cerrar sesión' }).click();
  await expect(page).toHaveURL(/\/login$/);
});

test('origen no autorizado y destinos fuera de la lista se rechazan', async ({
  request,
}) => {
  const headers = {
    Origin: 'https://example.invalid',
    'X-Forwarded-Host': 'example.invalid',
  };
  for (const [method, path] of [
    ['POST', '/api/session'],
    ['POST', '/api/session/logout'],
    ['POST', '/api/catalog/products'],
    ['PUT', '/api/catalog/products/1'],
    ['DELETE', '/api/catalog/products/1'],
  ]) {
    const response = await request.fetch(path, { method, headers, data: {} });
    expect(response.status()).toBe(403);
    expect((await response.json()).code).toBe('ORIGIN_FORBIDDEN');
  }
  expect((await request.post('/api/session', { data: {} })).status()).toBe(403);
  expect((await request.get('/api/catalog/auth/me')).status()).toBe(404);
});

test('el adaptador limita JSON antes de iniciar la autenticación', async ({
  request,
  baseURL,
}) => {
  const headers = {
    Origin: new URL(baseURL!).origin,
    'Content-Type': 'application/json',
  };
  const tooLarge = await request.post('/api/session', {
    headers,
    data: { username: 'fixture', password: 'x'.repeat(110 * 1024) },
  });
  expect(tooLarge.status()).toBe(413);
  expect((await tooLarge.json()).code).toBe('PAYLOAD_TOO_LARGE');
  const malformed = await request.post('/api/session', {
    headers,
    data: '{"username":',
  });
  expect(malformed.status()).toBe(400);
  expect((await malformed.json()).code).toBe('BAD_REQUEST');
});

test('el navegador vuelve al login con un JWT firmado pero vencido', async ({
  page,
  context,
  baseURL,
}) => {
  const secret = process.env.E2E_JWT_SECRET;
  test.skip(
    !secret,
    'Configura la misma clave local de prueba en NestJS y E2E_JWT_SECRET.',
  );
  const now = Math.floor(Date.now() / 1000);
  const encode = (value: object) =>
    Buffer.from(JSON.stringify(value)).toString('base64url');
  const data = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({
    sub: '1',
    role: 'admin',
    iat: now - 90,
    exp: now - 60,
    iss: 'catalogo-productos-upc-api',
    aud: 'catalogo-productos-upc',
  })}`;
  const token = `${data}.${createHmac('sha256', secret!).update(data).digest('base64url')}`;
  await context.addCookies([
    {
      name: 'upc_session',
      value: token,
      url: baseURL!,
      httpOnly: true,
      sameSite: 'Lax',
    },
  ]);
  await page.goto('/products');
  await expect(page).toHaveURL(/\/login$/);
  await expect(
    page.getByRole('heading', { name: 'Iniciar sesión' }),
  ).toBeVisible();
  const denied = await context.request.get('/api/catalog/products');
  expect(denied.status()).toBe(401);
  expect(
    (await context.cookies()).some(({ name }) => name === 'upc_session'),
  ).toBe(false);
});

test('el límite compartido por IP muestra un mensaje comprensible', async ({
  page,
  context,
  baseURL,
}) => {
  const headers = { Origin: new URL(baseURL!).origin };
  let limited = false;
  for (let attempt = 0; attempt < 11; attempt++) {
    const response = await context.request.post('/api/session', {
      headers: { ...headers, 'X-Forwarded-For': `192.0.2.${attempt + 1}` },
      data: { username: 'wrong@prueba.local', password: 'incorrecta' },
    });
    if (response.status() === 429) {
      limited = true;
      break;
    }
    expect(response.status()).toBe(401);
  }
  expect(limited).toBe(true);
  await page.goto('/login');
  await page.getByLabel('Usuario').fill(admin.username);
  await page.getByLabel('Contraseña', { exact: true }).fill(admin.password);
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await expect(page.getByText(/Demasiados intentos/)).toBeVisible();
});
