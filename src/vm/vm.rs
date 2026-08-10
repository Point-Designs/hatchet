pub enum ObjectType {
    Struct,
    Array,
    String,
}

pub struct HeapObject {
    pub obj_type: ObjectType,
    pub is_marked: bool,
}

pub struct VM {
    pub stack: Vec<Box<HeapObject>>,
    pub bytes_allocated: usize,
    pub gc_threshold: usize,
}

impl VM {
    pub fn new() -> Self {
        VM {
            stack: Vec::with_capacity(256),
            bytes_allocated: 0,
            gc_threshold: 1024 * 1024,
        }
    }

    pub fn push(&mut self, obj: Box<HeapObject>) {
        self.stack.push(obj);
    }

    pub fn pop(&mut self) -> Option<Box<HeapObject>> {
        self.stack.pop()
    }

    pub fn allocate(&mut self, obj_type: ObjectType) -> Box<HeapObject> {
        if self.bytes_allocated >= self.gc_threshold {
            self.collect_garbage();
        }

        let size = std::mem::size_of::<HeapObject>();
        self.bytes_allocated += size;

        Box::new(HeapObject {
            obj_type,
            is_marked: false,
        })
    }

    pub fn collect_garbage(&mut self) {
        let initial = self.bytes_allocated;

        for obj in self.stack.iter_mut() {
            obj.is_marked = true;
        }

        self.stack.retain(|obj| obj.is_marked);

        self.bytes_allocated = self.stack.len() * std::mem::size_of::<HeapObject>();
        self.gc_threshold = std::cmp::max(1024 * 1024, self.bytes_allocated * 2);

        println!(
            "[Hatchet Rust VM GC] Freed {} bytes.",
            initial - self.bytes_allocated
        );
    }
}