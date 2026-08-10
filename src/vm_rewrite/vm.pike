import .heap_object;

class HatchetVM {
    private array(mixed) stack = ({});
    private mapping(string:mixed) globals = ([]);

    void push(mixed val) {
        stack += ({ val });
    }

    mixed pop() {
        if (sizeof(stack) == 0) {
            error("HatchetVM Error: Stack underflow!\n");
        }
        mixed val = stack[-1];
        stack = stack[0..<1];
        return val;
    }

    mixed peek() {
        if (sizeof(stack) == 0) return 0;
        return stack[-1];
    }

    void set_global(string name, mixed val) {
        globals[name] = val;
    }

    HeapObject allocate_struct(string name, mapping(string:mixed) initial_fields) {
        HeapObject obj = HeapObject("struct");
        foreach (initial_fields; string field_name; mixed val) {
            obj->set_field(field_name, val);
        }
        return obj;
    }

    void execute_node(mapping(string:mixed) node) {
        string node_type = node->type;

        switch (node_type) {
            case "Literal":
                push(node->value);
                break;

            case "VarDecl":
                execute_node(node->value);
                mixed val = pop();
                set_global(node->name, val);
                write("  [VM] Defined global '%s' = %O\n", node->name, val);
                break;

            case "BinaryOp":
                execute_node(node->left);
                execute_node(node->right);
                mixed right = pop();
                mixed left = pop();

                switch (node->op) {
                    case "+": push(left + right); break;
                    case "-": push(left - right); break;
                    case "*": push(left * right); break;
                    case "/": push(left / right); break;
                }
                break;

            case "Print":
                execute_node(node->value);
                write("🪓 Out: %O\n", pop());
                break;

            default:
                write("  [VM Warning] Unknown AST Node type: %s\n", node_type);
                break;
        }
    }

    void run(array(mapping(string:mixed)) ast_body) {
        write("Running Hatchet VM (Pike Engine)\n");
        foreach (ast_body, mapping node) {
            execute_node(node);
        }
    }
}