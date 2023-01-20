# dps-autocursor

dps-autocursor is a Vim plugin that automatically switches between cursorline and cursorcolumn based on Vim events. This plugin offers a convenient way to quickly switch between the two settings without having to manually invoke `set cursorline` and `set cursorcolumn`.

[![asciicast](https://asciinema.org/a/rRXjQa16Iwchj4NfaUTNPTFEs.svg)](https://asciinema.org/a/rRXjQa16Iwchj4NfaUTNPTFEs)

[yukimemi's blog - Vim auto cursorline and cursorcolumn](https://yukimemi.netlify.app/vim-auto-cursorline-cursorcolumn/)

## Installation

To install `dps-autocursor`:

* Using [vim-plug](https://github.com/junegunn/vim-plug):
    ```vim
    Plug 'yukimemi/dps-autocursor'
    ```
* Using [dein.vim](https://github.com/Shougo/dein.vim):
    ```vim
    call dein#add('yukimemi/dps-autocursor')
    ```

## Usage

This plugin generally requires no configuration. The following are the default settings that can be customized as needed.

```vim
let g:autocursor_debug = v:false
let g:autocursor_blacklist_filetypes = ["ctrlp", "ddu-ff", "ddu-ff-filter", "ddu-filer", "dpswalk", "list", "qf", "quickfix"]
let g:autocursor_fix_interval = 5000
let g:autocursor_throttle = 300
let g:autocursor_cursorline = {
  \ "enable": v:true,
  \ "events": [
  \   {
  \     "name": "WinEnter",
  \     "set": v:true,
  \     "wait": 100,
  \   },
  \   {
  \     "name": "BufEnter",
  \     "set": v:true,
  \     "wait": 100,
  \   },
  \   {
  \     "name": "CursorHold",
  \     "set": v:true,
  \     "wait": 100,
  \   },
  \   {
  \     "name": "CursorHoldI",
  \     "set": v:true,
  \     "wait": 100,
  \   },
  \   {
  \     "name": "CursorMoved",
  \     "set": v:false,
  \     "wait": 0,
  \   },
  \   {
  \     "name": "CursorMovedI",
  \     "set": v:false,
  \     "wait": 0,
  \   }
  \  ]
  \ }
let g:autocursor_cursorcolumn = {
  \ "enable": v:true,
  \ "events": [
  \   {
  \     "name": "WinEnter",
  \     "set": v:true,
  \     "wait": 100,
  \   },
  \   {
  \     "name": "BufEnter",
  \     "set": v:true,
  \     "wait": 100,
  \   },
  \   {
  \     "name": "CursorHold",
  \     "set": v:true,
  \     "wait": 100,
  \   },
  \   {
  \     "name": "CursorHoldI",
  \     "set": v:true,
  \     "wait": 100,
  \   },
  \   {
  \     "name": "CursorMoved",
  \     "set": v:false,
  \     "wait": 0,
  \   },
  \   {
  \     "name": "CursorMovedI",
  \     "set": v:false,
  \     "wait": 0,
  \   }
  \  ]
  \ }
```


