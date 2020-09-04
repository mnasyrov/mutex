export class Mutex {
  private latchPromise: Promise<void> | void = undefined;
  private latchResolver: (() => void) | void = undefined;
  private latchRejector: ((reason?: any) => void) | void = undefined;

  get isLocked(): boolean {
    return !!this.latchPromise;
  }

  async waitRelease() {
    if (this.latchPromise) {
      await this.latchPromise;
    }
  }

  async lock() {
    // Inline waitRelease
    if (this.latchPromise) {
      await this.latchPromise;
    }

    if (!this.latchPromise) {
      this.latchPromise = new Promise<void>((resolver, rejector) => {
        this.latchResolver = resolver;
        this.latchRejector = rejector;
      });
    }
  }

  release() {
    if (this.latchPromise) {
      const currentResolver = this.latchResolver;
      this.clearState();

      if (currentResolver) {
        currentResolver();
      }
    }
  }

  reject(reason?: any) {
    if (this.latchPromise) {
      const currentRejector = this.latchRejector;
      this.clearState();

      if (currentRejector) {
        currentRejector(reason);
      }
    }
  }

  private clearState() {
    this.latchPromise = undefined;
    this.latchResolver = undefined;
    this.latchRejector = undefined;
  }
}
