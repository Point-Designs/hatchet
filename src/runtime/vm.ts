import { Heap } from "./heap";
import { GarbageCollector, VMState } from "./gc";

export class HatchetVM {
  public heap: Heap;
  public gc: GarbageCollector;
  public state: VMState;

  constructor() {
    this.heap = new Heap();
    this.gc = new GarbageCollector(this.heap);
    this.state = {
      stack: [],
      globals: new Map()
    };
  }

  public createStructInstance(fields: Record<string, any>) {
    if (this.heap.bytesAllocated >= this.heap.gcThreshold) {
      this.gc.collect(this.state);
    }

    const instance = this.heap.allocateStruct(fields);
    return instance;
  }
}