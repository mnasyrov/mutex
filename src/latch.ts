export class Latch<T> {
  private promise: Promise<T>;
  private resolver?: (value?: T | PromiseLike<T>) => void;
  private rejector?: (reason?: any) => void;
  private _isPending = true;

  constructor(private count: number = 1) {
    this.promise = new Promise<T>((resolver, rejector) => {
      this.resolver = resolver;
      this.rejector = rejector;
    });
  }

  static fromPromise<T>(source: PromiseLike<T>): Latch<T> {
    const latch = new Latch<T>();

    source.then(
      (value) => latch.release(value),
      (reason) => latch.reject(reason),
    );

    return latch;
  }

  isPending(): boolean {
    return this._isPending;
  }

  release(value: T | PromiseLike<T>) {
    if (this._isPending) {
      this.count--;
      if (this.count <= 0) {
        this._isPending = false;
        this.promise = Promise.resolve<T>(value);
        if (this.resolver) {
          this.resolver(value);
        }
        this.resolver = undefined;
        this.rejector = undefined;
      }
    }
  }

  reject(reason?: any) {
    if (this._isPending) {
      this._isPending = false;
      if (this.rejector) {
        this.rejector(reason);
      }
      this.resolver = undefined;
      this.rejector = undefined;
    }
  }

  wait(): Promise<T> {
    return this.promise;
  }
}
