## v.1.3.0 - 27 Mar, 2016

Features

-  Added `auto` as parser name option to check what parser is available
-  Non existing requested parsers falls back into auto mode instead of always choosing the JS parser

## v.1.2.0 - 27 Mar, 2016

Features

-  Added `stringNumbers` option to make sure all numbers are returned as string instead of a js number for precision
-  The parser is from now on going to print warnings if a parser is explicitly requested that does not exist and gracefully chooses the JS parser

## v.1.1.0 - 26 Jan, 2016

Features

-  The parser is from now on going to reset itself on protocol errors
