export class Mutex {
  private promise?: Promise<void>;
  private resolver?: () => void;
  private rejector?: (reason?: any) => void;

  constructor(isLocked?: boolean) {
    if (isLocked) {
      this.lock();
    }
  }

  isLocked(): boolean {
    return Boolean(this.promise);
  }

  async lock() {
    // Inline waitRelease
    if (this.promise) {
      await this.promise;
    }

    if (!this.promise) {
      this.promise = new Promise<void>((resolver, rejector) => {
        this.resolver = resolver;
        this.rejector = rejector;
      });
    }
  }

  release() {
    if (this.promise) {
      const currentResolver = this.resolver;
      this.clearState();

      if (currentResolver) {
        currentResolver();
      }
    }
  }

  reject(reason?: any) {
    if (this.promise) {
      const currentRejector = this.rejector;
      this.clearState();

      if (currentRejector) {
        currentRejector(reason);
      }
    }
  }

  async wait() {
    if (this.promise) {
      await this.promise;
    }
  }

  private clearState() {
    this.promise = undefined;
    this.resolver = undefined;
    this.rejector = undefined;
  }
}
