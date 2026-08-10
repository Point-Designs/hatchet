<div align="center">
	<img src="HatchetLogo2_2026.png" height="300">
	<h1>Hatchet</h1>
	<p><b>The programming language</b></p>
</div>

Hatchet is a programming language made for efficiency and speed. It can transpile to GameMaker Language, CSharp and GDScript, has a readable syntax, and more.

Code examples:
```rs
struct Entity {
    var hp = 100;
}

struct Player extends Entity {
    proc speak() {
        printstr("Hello World\n");
    }
}
```
This Hatchet code will look like this in all mentioned languages.

* GameMaker Language:
```gml
function Entity() constructor {
    self.hp = 100;
}

function Player() : Entity() constructor {
    static speak = function() {
        show_debug_message("Hello World\n");
    };
}
```
* CSharp:
```cs
using System;

namespace HatchetApp {
public class Entity {
    public int hp = 100;
}

public class Player : Entity {
    public void speak() {
        Console.Write("Hello World\n");
    }
}
}
```
* and GDScript:
```py
class_name Entity
extends RefCounted

var hp = 100

class_name Player
extends Entity

func speak():
    printraw("Hello World\n")
```
