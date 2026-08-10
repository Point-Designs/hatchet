#include <stdio.h>
#include <stdlib.h>
#include "vm.h"

void vm_init(VM* vm) {
    vm->stackTop = 0;
    vm->heap.head = NULL;
    vm->heap.bytesAllocated = 0;
    vm->heap.gcThreshold = 1024 * 1024;
}

void vm_push(VM* vm, Obj* obj) {
    if (vm->stackTop < STACK_MAX) {
        vm->stack[vm->stackTop++] = obj;
    }
}

Obj* vm_pop(VM* vm) {
    if (vm->stackTop > 0) {
        return vm->stack[--vm->stackTop];
    }
    return NULL;
}

static void mark_object(Obj* obj) {
    if (obj == NULL || obj->isMarked) return;
    obj->isMarked = true;
}

static void mark_roots(VM* vm) {
    for (int i = 0; i < vm->stackTop; i++) {
        mark_object(vm->stack[i]);
    }
}

static void sweep(VM* vm) {
    Obj** object = &vm->heap.head;
    while (*object != NULL) {
        if (!(*object)->isMarked) {
            Obj* unreached = *object;
            *object = unreached->next;
            
            vm->heap.bytesAllocated -= sizeof(Obj);
            free(unreached);
        } else {
            (*object)->isMarked = false;
            object = &(*object)->next;
        }
    }
}

void gc_collect(VM* vm) {
    size_t before = vm->heap.bytesAllocated;
    
    mark_roots(vm);
    sweep(vm);

    vm->heap.gcThreshold = vm->heap.bytesAllocated * 2;
    printf("[Hatchet Native GC] Freed %zu bytes.\n", before - vm->heap.bytesAllocated);
}

Obj* heap_allocate(VM* vm, ObjectType type) {
    if (vm->heap.bytesAllocated >= vm->heap.gcThreshold) {
        gc_collect(vm);
    }

    Obj* obj = (Obj*)malloc(sizeof(Obj));
    obj->type = type;
    obj->isMarked = false;
    obj->next = vm->heap.head;
    vm->heap.head = obj;

    vm->heap.bytesAllocated += sizeof(Obj);
    return obj;
}

void vm_free(VM* vm) {
    Obj* current = vm->heap.head;
    while (current != NULL) {
        Obj* next = current->next;
        free(current);
        current = next;
    }
    vm->heap.head = NULL;
}