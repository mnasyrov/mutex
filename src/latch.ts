type Resolver<T> = (value?: T | PromiseLike<T>) => void;
type Rejector = (reason?: any) => void;

export class Latch<T> {
  private latchPromise: Promise<T>;
  private latchResolver: Resolver<T> | void = undefined;
  private latchRejector: Rejector | void = undefined;
  private _isPending = true;

  constructor(private count: number = 1) {
    this.latchPromise = new Promise<T>((resolver, rejector) => {
      this.latchResolver = resolver;
      this.latchRejector = rejector;
    });
  }

  get isPending(): boolean {
    return this._isPending;
  }

  followPromise(promise: PromiseLike<T>) {
    promise.then(
      (value) => this.release(value),
      (reason) => this.reject(reason),
    );
  }

  release(value: T | PromiseLike<T>) {
    if (this._isPending) {
      this.count--;
      if (this.count <= 0) {
        this._isPending = false;
        this.latchPromise = Promise.resolve<T>(value);
        if (this.latchResolver) {
          this.latchResolver(value);
        }
        this.latchResolver = undefined;
        this.latchRejector = undefined;
      }
    }
  }

  reject(reason?: any) {
    if (this._isPending) {
      this._isPending = false;
      if (this.latchRejector) {
        this.latchRejector(reason);
      }
      this.latchResolver = undefined;
      this.latchRejector = undefined;
    }
  }

  wait(): Promise<T> {
    return this.latchPromise;
  }
}
