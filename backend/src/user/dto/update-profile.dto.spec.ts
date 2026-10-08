import { validate } from 'class-validator';
import { UpdateProfileDto } from './update-profile.dto';

async function portfolioErrors(values: string[]): Promise<string[]> {
  const dto = new UpdateProfileDto();
  dto.portfolioUrls = values;
  const errors = await validate(dto);
  return errors.flatMap((e) =>
    Object.values(e.children?.[0]?.constraints ?? e.constraints ?? {}),
  );
}

describe('UpdateProfileDto portfolioUrls', () => {
  it('accepts absolute URLs', async () => {
    await expect(
      portfolioErrors(['https://example.com/work.pdf']),
    ).resolves.toEqual([]);
  });

  it('accepts storage keys written by upload confirm', async () => {
    await expect(
      portfolioErrors(['portfolios/user-1/case-study.pdf']),
    ).resolves.toEqual([]);
  });

  it('rejects garbage that is neither URL nor key', async () => {
    const errors = await portfolioErrors(['not-a-url']);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('rejects keys with path traversal', async () => {
    const errors = await portfolioErrors(['portfolios/user-1/../secret']);
    expect(errors.length).toBeGreaterThan(0);
  });
});
