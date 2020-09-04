type Job<T> = {
  action: () => Promise<T>;
  resolver: (value: T) => void;
  rejector: (reason: any) => void;
};

/**
 * Schedule calls of an async action to run strictly one by one.
 */
export class ActionPipeline<T> {
  private readonly maxCapacity: number | undefined;
  private readonly queue: Array<Job<T>> = [];

  private _isBusy = false;
  private lastResultPromise: Promise<T> | void = undefined;
  private completePromise: Promise<void> | void = undefined;

  constructor(maxCapacity?: number) {
    this.maxCapacity = maxCapacity;
  }

  isBusy(): boolean {
    return this._isBusy;
  }

  ready(): Promise<void> {
    if (!this._isBusy || !this.completePromise) {
      return Promise.resolve();
    }

    return this.completePromise;
  }

  execute(asyncAction: () => Promise<T>): Promise<T> {
    const isQueueExceeded: boolean =
      this.maxCapacity !== undefined &&
      this.queue.length + 1 >= this.maxCapacity;

    if (isQueueExceeded && this.lastResultPromise) {
      return this.lastResultPromise;
    }

    this.lastResultPromise = new Promise<T>((resolver, rejector) => {
      this.queue.push({action: asyncAction, resolver, rejector});
    });

    if (!this._isBusy) {
      this._isBusy = true;
      this.completePromise = new Promise((complete) => {
        this.executeQueue().then(() => {
          this._isBusy = false;
          this.lastResultPromise = undefined;
          complete();
        });
      });
    }

    return this.lastResultPromise;
  }

  private async executeQueue() {
    while (this.queue.length > 0) {
      const job = this.queue.shift();
      if (!job) {
        break;
      }

      try {
        const actionResult = await job.action();
        job.resolver(actionResult);
      } catch (error) {
        job.rejector(error);
      }
    }
  }
}
