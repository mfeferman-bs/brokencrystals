import { test, before, after } from 'node:test';
import { Severity, AttackParamLocation, HttpMethod } from '@sectester/scan';
// Other setup and teardown logic from the test skeleton

const timeout = 40 * 60 * 1000;
const baseUrl = process.env.BRIGHT_TARGET_URL!;

// Test for POST /api/auth/admin/login

test('POST /api/auth/admin/login', { signal: AbortSignal.timeout(timeout) }, async () => {
  await runner
    .createScan({
      tests: ['csrf', 'jwt', 'sqli', 'ldap', 'secret_tokens', 'osi'],
      attackParamLocations: [AttackParamLocation.BODY]
    })
    .threshold(Severity.CRITICAL)
    .timeout(timeout)
    .run({
      method: HttpMethod.POST,
      url: `${baseUrl}/api/auth/admin/login`,
      body: {
        user: "example@example.com",
        password: "examplePassword"
      },
      headers: { 'Content-Type': 'application/json' }
    });
});
