class HeapObject {
    string type;
    mapping(string:mixed) fields = ([]);
    array(mixed) elements = ({});
    mixed value;

    void create(string _type) {
        type = _type;
    }

    void set_field(string name, mixed val) {
        fields[name] = val;
    }

    mixed get_field(string name) {
        return fields[name];
    }
}