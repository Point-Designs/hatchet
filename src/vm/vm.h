#ifndef HATCHET_VM_H
#define HATCHET_VM_H

#include <stdbool.h>
#include <stdint.h>
#include <size_t.h>

typedef enum {
    OBJ_STRUCT,
    OBJ_ARRAY,
    OBJ_STRING
} ObjectType;

typedef struct Obj {
    ObjectType type;
    bool isMarked;
    struct Obj* next;
} Obj;

typedef struct {
    Obj* head;
    size_t bytesAllocated;
    size_t gcThreshold;
} Heap;

#define STACK_MAX 256

typedef struct {
    Obj* stack[STACK_MAX];
    int stackTop;
    Heap heap;
} VM;

void vm_init(VM* vm);
void vm_free(VM* vm);
void vm_push(VM* vm, Obj* obj);
Obj* vm_pop(VM* vm);

Obj* heap_allocate(VM* vm, ObjectType type);
void gc_collect(VM* vm);

#endif