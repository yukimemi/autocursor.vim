import { start } from "https://deno.land/x/denops_std@v0.3/mod.ts";
import { AutocmdEvent } from "https://deno.land/x/denops_std@v0.3/vim/mod.ts";

let debug = false;

const cursorline = "cursorline";
const cursorcolumn = "cursorcolumn";
const lineWait = 900;
const columnWait = 1000;

type Event = {
  name: AutocmdEvent;
  set: boolean;
  wait: number;
};

type Cursor = {
  enable: boolean;
  option: string;
  state: boolean;
  events: Event[];
};

const cfgLine: Cursor = {
  enable: true,
  option: cursorline,
  state: false,
  events: [
    {
      name: "CursorHold",
      set: true,
      wait: lineWait,
    },
    {
      name: "CursorHoldI",
      set: true,
      wait: lineWait,
    },
    {
      name: "WinEnter",
      set: true,
      wait: 0,
    },
    {
      name: "BufEnter",
      set: true,
      wait: 0,
    },
    {
      name: "CmdwinLeave",
      set: true,
      wait: 0,
    },
    {
      name: "CursorMoved",
      set: false,
      wait: 0,
    },
    {
      name: "CursorMovedI",
      set: false,
      wait: 0,
    },
  ],
};
const cfgColumn: Cursor = {
  enable: true,
  option: cursorcolumn,
  state: false,
  events: [
    {
      name: "CursorHold",
      set: true,
      wait: columnWait,
    },
    {
      name: "CursorHoldI",
      set: true,
      wait: columnWait,
    },
    {
      name: "WinEnter",
      set: true,
      wait: 0,
    },
    {
      name: "BufEnter",
      set: true,
      wait: 0,
    },
    {
      name: "CmdwinLeave",
      set: true,
      wait: 0,
    },
    {
      name: "CursorMoved",
      set: false,
      wait: 0,
    },
    {
      name: "CursorMovedI",
      set: false,
      wait: 0,
    },
  ],
};

const clog = (...data: any[]): void => {
  if (debug) {
    console.log(...data);
  }
};

start(async (vim) => {
  // debug.
  try {
    debug = await vim.g.get("autocursor_debug");
  } catch (e) {
    // console.log(e);
  }

  // User option.
  try {
    const userCfg = await vim.g.get("autocursor_cursorline");
    clog(userCfg);
  } catch (e) {
    clog(e);
  }

  vim.register({
    async setOption(set: unknown, wait: unknown, option: unknown) {
      const s = set as boolean;
      const w = wait as number;
      const o = option as string;
      if (o === cursorline) {
        if (s === cfgLine.state || !cfgLine.enable) {
          clog(
            `setOption: cfgLine.state: ${cfgLine.state}, cfgLine.enable: ${cfgLine.enable} so return.`
          );
          return;
        }
      }
      if (o === cursorcolumn) {
        if (s === cfgColumn.state || !cfgColumn.enable) {
          clog(
            `setOption: cfgColumn.state: ${cfgColumn.state}, cfgColumn.enable: ${cfgColumn.enable} so return.`
          );
          return;
        }
      }
      setTimeout(async () => {
        const option = s ? o : `no${o}`;
        clog(`setOption: set ${option}`);
        await vim.execute(`set ${option}`);
        if (o === cursorline) {
          cfgLine.state = s;
        }
        if (o === cursorcolumn) {
          cfgColumn.state = s;
        }
      }, w);
      return await Promise.resolve();
    },
    async changeCursor(enable: unknown, option: unknown) {
      const e = enable as boolean;
      const o = option as string;
      if (!e) {
        vim.execute(`set no${o}`);
      }
      if (o === cursorline) {
        cfgLine.enable = e;
      }
      if (o === cursorcolumn) {
        cfgColumn.enable = e;
      }
      return await Promise.resolve();
    },
  });

  await vim.autocmd("autocursor", (helper) => {
    helper.remove("*");
    [cfgLine, cfgColumn].forEach((cfg) => {
      cfg.events.forEach((e) => {
        helper.define(
          e.name,
          "*",
          `call denops#notify('${vim.name}', 'setOption', [${
            e.set ? "v:true" : "v:false"
          }, ${e.wait}, '${cfg.option}'])`
        );
      });
    });
  });

  await vim.execute(`
    command! EnableAutoCursorLine call denops#notify('${vim.name}', 'changeCursorLine', [v:true])
    command! EnableAutoCursorColumn call denops#notify('${vim.name}', 'changeCursorColumn', [v:true])
    command! DisableAutoCursorLine call denops#notify('${vim.name}', 'changeCursorLine', [v:false])
    command! DisableAutoCursorColumn call denops#notify('${vim.name}', 'changeCursorColumn', [v:false])
  `);

  clog("dps-autocursor has loaded");
});
