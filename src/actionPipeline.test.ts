import {ActionPipeline} from './actionPipeline';

describe('ActionPipeline', () => {
  it('should execute actions one by one (serialPipe)', async () => {
    const pipeline = new ActionPipeline<void>();
    const results: Array<number> = [];

    pipeline.execute(() => action(results, 100));
    pipeline.execute(() => action(results, 50));
    pipeline.execute(() => action(results, 20));
    await pipeline.ready();

    expect(results).toEqual([100, 50, 20]);
  });

  it('should execute a single active action only (singleAction)', async () => {
    const pipeline = new ActionPipeline<void>(1);
    const results: Array<number> = [];

    pipeline.execute(() => action(results, 100));
    pipeline.execute(() => action(results, 50));
    pipeline.execute(() => action(results, 20));
    await pipeline.ready();

    expect(results).toEqual([100]);
  });

  it('should execute two active actions only (twoSerialActions)', async () => {
    const pipeline = new ActionPipeline<void>(2);
    const results: Array<number> = [];

    pipeline.execute(() => action(results, 100));
    pipeline.execute(() => action(results, 50));
    pipeline.execute(() => action(results, 20));
    await pipeline.ready();

    expect(results).toEqual([100, 50]);
  });

  function action(results: Array<number>, delay: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        results.push(delay);
        resolve();
      }, delay);
    });
  }
});
