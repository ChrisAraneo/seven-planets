import { expect, test } from '@playwright/test';
import { chain } from 'lodash-es';
import { match, P } from 'ts-pattern';

const { nullish } = P;

test('an ?auto demo game plays turns by itself', ({ page }) =>
  chain([] as string[])
    .tap((errors) => page.on('pageerror', (e) => errors.push(String(e))))
    .thru((errors) =>
      page
        .goto('/?auto')
        .then(() =>
          expect(page.locator('#turn-ind')).toContainText(/Turn \d+/, {
            timeout: 30_000,
          }),
        )
        .then(() =>
          expect
            .poll(
              () =>
                page
                  .locator('#turn-ind')
                  .textContent()
                  .then((text) =>
                    match(/Turn (\d+)/.exec(text ?? ''))
                      .with(nullish, () => 0)
                      .otherwise((m) => Number(m[1])),
                  ),
              { timeout: 60_000 },
            )
            .toBeGreaterThan(2),
        )
        .then(() => expect(errors).toEqual([])),
    )
    .value());
