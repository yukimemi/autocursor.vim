# dps-autocursor

Denops auto cursorline / cursorcolumn.



<a href="https://asciinema.org/a/rRXjQa16Iwchj4NfaUTNPTFEs" target="_blank"><img src="https://asciinema.org/a/rRXjQa16Iwchj4NfaUTNPTFEs.svg" /></a>

# Features 

dps-autocursor is a Vim plugin that automatically switches between cursorline and cursorcolumn based on Vim events. This plugin offers a convenient way to quickly switch between the two settings without having to manually invoke `set cursorline` and `set cursorcolumn`.

# Installation 

If you use [folke/lazy.nvim](https://github.com/folke/lazy.nvim).

```
  {
    "yukimemi/dps-autocursor",
    lazy = false,
    dependencies = {
      "vim-denops/denops.vim",
    },
  }
```

If you use [yukimemi/dvpm](https://github.com/yukimemi/dvpm).

```
  dvpm.add({ url: "yukimemi/dps-autocursor" });
```

# Requirements 

- [Deno - A modern runtime for JavaScript and TypeScript](https://deno.land/)
- [vim-denops/denops.vim: 🐜 An ecosystem of Vim/Neovim which allows developers to write cross-platform plugins in Deno](https://github.com/vim-denops/denops.vim)
# Usage 

No special settings are required.
By default, `CursorHold`, `CursorHoldI`, `WinEnter` and `BufEnter` will automatically `set cursorline` and `set cursorcolumn`, and `CursorMoved` and `CursorMovedI` will `set nocursorline` and `set nocursorcolumn`.

# Commands 

`:DisableAutoCursorLine`                              
Disable auto change cursorline.

`:EnableAutoCursorLine`                                
Enable auto change cursorline.

`:DisableAutoCursorColumn`                          
Disable auto change cursorcolumn.

`:EnableAutoCursorColumn`                            
Enable auto change cursorcolumn.

# Config 

No settings are required. However, the following settings can be made if necessary.

`g:autocursor_debug`                        
Enable debug messages.
default is v:false

`g:autocursor_ignore_filetypes`                
A list of filetypes to be ignored.
default is ["ctrlp", "ddu-ff", "ddu-ff-filter", "ddu-filer", "dpswalk", "list", "qf", "quickfix"]

`g:autocursor_fix_interval`                        
Interval to fix cursorline and cursorcolumn state.
An interval value to match the internal state, such as when changed from the outside.
default is 5000 (millisec)

`g:autocursor_throttle`                                
Delay time when multiple events occur simultaneously.
Events that occur simultaneously within this time are ignored.
default is 300 (millisec)

`g:autocursor_cursorline`                            
Configuration information about `cursorline`.

- When `CursorHold` and `CursorHoldI` occur, do `set cursorline` after 100ms.
- When `WinEnter` and `BufEnter` occur, do `set cursorline` immediatly.
- When `CursorMoved` and `BufEnter` occur, do `set nocursorline` immediatly.
default setting is above.

`g:autocursor_cursorcolumn`                            
Configuration information about `cursorcolumn`.

- When `CursorHold` and `CursorHoldI` occur, do `set cursorcolumn` after 100ms.
- When `WinEnter` and `BufEnter` occur, do `set cursorcolumn` immediatly.
- When `CursorMoved` and `BufEnter` occur, do `set nocursorcolumn` immediatly.
default setting is above.

# Example 

If you use [folke/lazy.nvim](https://github.com/folke/lazy.nvim).

# License 

Licensed under MIT License.

Copyright (c) 2023 yukimemi

