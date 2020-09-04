import {Mutex} from './mutex';

export class Latch {
  private _isPending = true;
  private mutex = Mutex.asLocked();

  constructor(private count: number = 1) {}

  static fromPromise(source: PromiseLike<void>): Latch {
    const latch = new Latch();

    source.then(
      () => latch.release(),
      (reason) => latch.reject(reason),
    );

    return latch;
  }

  isPending(): boolean {
    return this._isPending;
  }

  release() {
    if (this._isPending) {
      this.count--;
      if (this.count <= 0) {
        this._isPending = false;
        this.mutex.release();
      }
    }
  }

  reject(reason?: any) {
    if (this._isPending) {
      this._isPending = false;
      this.mutex.reject(reason);
    }
  }

  wait(): Promise<void> {
    return this.mutex.wait();
  }
}

export class ValueLatch<T> {
  private valueRef: {value: T} | void = undefined;
  private latch: Latch;

  constructor(count?: number) {
    this.latch = new Latch(count);
  }

  static fromPromise<T>(source: PromiseLike<T>): ValueLatch<T> {
    const latch = new ValueLatch<T>();

    source.then(
      (value) => latch.release(value),
      (reason) => latch.reject(reason),
    );

    return latch;
  }

  isPending(): boolean {
    return this.latch.isPending();
  }

  release(value: T) {
    this.valueRef = {value};
    this.latch.release();
  }

  reject(reason?: any) {
    this.latch.reject(reason);
  }

  async wait(): Promise<T> {
    await this.latch.wait();

    if (!this.valueRef) {
      // Should never happens.
      throw new Error('Value is not set');
    }

    return this.valueRef.value;
  }
}
