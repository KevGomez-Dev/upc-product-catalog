require('reflect-metadata');
const argon2 = require('argon2');
const { AuthService } = require('../dist/auth/auth.service.js');

test('usuario ausente y contraseña incorrecta ejecutan una verificación Argon2id equivalente', async () => {
  const storedHash = await argon2.hash('fixture-demo-password', {
    type: argon2.argon2id,
  });
  const builder = {
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getOne: jest.fn().mockResolvedValueOnce(null).mockResolvedValueOnce({
      id: 1,
      role: 'admin',
      passwordHash: storedHash,
    }),
  };
  const signer = { signAsync: jest.fn() };
  const service = new AuthService(
    { createQueryBuilder: () => builder },
    signer,
  );
  await service.onModuleInit();

  const verification = jest.spyOn(argon2, 'verify');
  try {
    const password = '  incorrecta  ';
    for (const username of ['not-found@prueba.local', 'admin@prueba.local']) {
      await expect(service.login({ username, password })).rejects.toMatchObject(
        {
          status: 401,
          details: {
            code: 'INVALID_CREDENTIALS',
            message: 'Usuario o contraseña incorrectos.',
          },
        },
      );
    }
    expect(verification).toHaveBeenCalledTimes(2);
    const [[dummyHash, firstPassword], [realHash, secondPassword]] =
      verification.mock.calls;
    expect(dummyHash).not.toBe(realHash);
    expect(realHash).toBe(storedHash);
    expect(dummyHash.split('$').slice(1, 4)).toEqual(
      realHash.split('$').slice(1, 4),
    );
    expect(firstPassword).toBe(password);
    expect(secondPassword).toBe(password);
    expect(signer.signAsync).not.toHaveBeenCalled();
  } finally {
    verification.mockRestore();
  }
});
