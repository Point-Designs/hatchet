import { Heap, HeapObject } from "./heap";

export interface VMState {
  stack: any[];
  globals: Map<string, any>;
}

export class GarbageCollector {
  private heap: Heap;

  constructor(heap: Heap) {
    this.heap = heap;
  }

  public collect(vm: VMState): void {
    const initialBytes = this.heap.bytesAllocated;

    this.markRoots(vm);

    const freedBytes = this.sweep();

    this.heap.gcThreshold = Math.max(1024 * 1024, this.heap.bytesAllocated * 2);

    console.log(
      `[Hatchet GC] Collected ${freedBytes} bytes. ` +
      `Heap size: ${this.heap.bytesAllocated} bytes. Next threshold: ${this.heap.gcThreshold} bytes.`
    );
  }

  private markRoots(vm: VMState): void {
    for (const value of vm.stack) {
      this.markValue(value);
    }

    for (const value of vm.globals.values()) {
      this.markValue(value);
    }
  }

  private markValue(value: any): void {
    if (!value || typeof value !== "object" || !("isMarked" in value)) {
      return;
    }

    const obj = value as HeapObject;
    if (obj.isMarked) return;

    obj.isMarked = true;

    for (const fieldValue of obj.fields.values()) {
      this.markValue(fieldValue);
    }

    for (const elem of obj.elements) {
      this.markValue(elem);
    }
  }

  private sweep(): number {
    let freedBytes = 0;
    let previous: HeapObject | null = null;
    let current = this.heap.getHead();

    while (current !== null) {
      if (current.isMarked) {
        current.isMarked = false;
        previous = current;
        current = current.next;
      } else {
        const unreached = current;
        current = current.next;

        if (previous !== null) {
          previous.next = current;
        } else {
          this.heap.setHead(current);
        }

        const objectSize = unreached.type === "array" 
          ? 48 + unreached.elements.length * 8 
          : 64;

        freedBytes += objectSize;
        this.heap.bytesAllocated -= objectSize;
      }
    }

    return freedBytes;
  }
}