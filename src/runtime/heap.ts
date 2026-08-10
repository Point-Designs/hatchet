export type HeapObjectType = "struct" | "array" | "string";

export interface HeapObject {
  id: number;
  type: HeapObjectType;
  isMarked: boolean;
  fields: Map<string, any>;
  elements: any[];
  stringValue?: string;
  next: HeapObject | null;
}

export class Heap {
  private head: HeapObject | null = null;
  private nextId: number = 1;
  public bytesAllocated: number = 0;
  public gcThreshold: number = 1024 * 1024;

  public allocateStruct(fields: Record<string, any> = {}): HeapObject {
    const obj: HeapObject = {
      id: this.nextId++,
      type: "struct",
      isMarked: false,
      fields: new Map(Object.entries(fields)),
      elements: [],
      next: this.head
    };

    this.head = obj;
    this.bytesAllocated += 64;
    return obj;
  }

  public allocateArray(elements: any[] = []): HeapObject {
    const obj: HeapObject = {
      id: this.nextId++,
      type: "array",
      isMarked: false,
      fields: new Map(),
      elements: elements,
      next: this.head
    };

    this.head = obj;
    this.bytesAllocated += 48 + elements.length * 8;
    return obj;
  }

  public getHead(): HeapObject | null {
    return this.head;
  }

  public setHead(head: HeapObject | null): void {
    this.head = head;
  }
}