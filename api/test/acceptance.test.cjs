require('reflect-metadata');
const { Reflector } = require('@nestjs/core');
const { hash, argon2id } = require('argon2');
const { validateSync } = require('class-validator');
const { allowedRoles } = require('../dist/auth/auth.decorators.js');
const { AuthService } = require('../dist/auth/auth.service.js');
const { RolesGuard } = require('../dist/auth/roles.guard.js');
const { ProductWriteDto } = require('../dist/products/product.dto.js');

test('el DTO de producto exige UPC, descripción y los dos códigos de clasificación', () => {
  const errors = validateSync(new ProductWriteDto());
  expect(errors.map(({ property }) => property).sort()).toEqual([
    'categoryCode',
    'subCategoryCode',
    'upcCode',
    'upcDescription',
  ]);
});

test('login válido firma la identidad y el rol obtenidos de la cuenta', async () => {
  const password = 'fixture-auth-only';
  const user = {
    id: 17,
    role: 'manager',
    passwordHash: await hash(password, { type: argon2id }),
  };
  const builder = {
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getOne: jest.fn().mockResolvedValue(user),
  };
  const signAsync = jest.fn().mockResolvedValue('fixture-token');
  const auth = new AuthService(
    { createQueryBuilder: () => builder },
    { signAsync },
  );
  await auth.onModuleInit();
  expect(
    await auth.login({ username: 'fixture@prueba.local', password }),
  ).toEqual({ accessToken: 'fixture-token' });
  expect(signAsync).toHaveBeenCalledWith(
    { role: 'manager' },
    { subject: '17' },
  );
});

test('el guard de roles distingue consulta de escritura y exige permiso explícito', () => {
  const guard = new RolesGuard(new Reflector());
  const read = () => {};
  const write = () => {};
  const fallback = () => {};
  Reflect.defineMetadata(allowedRoles, ['admin', 'manager'], read);
  Reflect.defineMetadata(allowedRoles, ['admin'], write);
  const context = (handler, role) => ({
    getHandler: () => handler,
    getClass: () => Object,
    switchToHttp: () => ({ getRequest: () => ({ authUser: { id: 1, role } }) }),
  });
  expect(guard.canActivate(context(read, 'manager'))).toBe(true);
  expect(guard.canActivate(context(write, 'admin'))).toBe(true);
  expect(() => guard.canActivate(context(write, 'manager'))).toThrow(
    expect.objectContaining({ status: 403 }),
  );
  expect(() => guard.canActivate(context(fallback, 'admin'))).toThrow(
    expect.objectContaining({ status: 403 }),
  );
});
