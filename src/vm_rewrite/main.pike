import .vm;

int main(int argc, array(string) argv) {
    write("=====================================================\n");
    write("   Hatchet VM rewritten in Pike lang (cuz why not)   \n");
    write("=====================================================\n\n");

    HatchetVM vm = HatchetVM();

    array(mapping(string:mixed)) ast_program = ({
        ([
            "type": "VarDecl",
            "name": "hp",
            "value": ([
                "type": "BinaryOp",
                "op": "+",
                "left": (["type": "Literal", "value": 80]),
                "right": (["type": "Literal", "value": 20])
            ])
        ]),
        ([
            "type": "Print",
            "value": ([
                "type": "BinaryOp",
                "op": "*",
                "left": (["type": "Literal", "value": 2]),
                "right": (["type": "Literal", "value": 50])
            ])
        ])
    });

    vm->run(ast_program);

    write("\nVM Execution Completed Successfully.\n");
    return 0;
}