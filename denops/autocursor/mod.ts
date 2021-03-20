import { start } from "https://deno.land/x/denops_std@v0.4/mod.ts";
import { AutocmdEvent } from "https://deno.land/x/denops_std@v0.3/vim/mod.ts";

const cursorline = "cursorline";
const cursorcolumn = "cursorcolumn";
const lineWait = 500;
const columnWait = 500;

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

let cfgLine: Cursor = {
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
let cfgColumn: Cursor = {
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

start(async (vim) => {
  // debug.
  const debug = await vim.g.get("autocursor_debug", false);
  const clog = (...data: any[]): void => {
    if (debug) {
      console.log(...data);
    }
  };

  // User option.
  try {
    const userCfgLine = (await vim.g.get("autocursor_cursorline")) as Cursor;
    clog({ userCfgLine });
    const lineEvents = cfgLine.events.filter(
      (x) => !userCfgLine.events.some((y) => y.name === x.name)
    );
    cfgLine = {
      ...cfgLine,
      ...userCfgLine,
      events: [...lineEvents, ...userCfgLine.events],
    };
    clog({ cfgLine });
  } catch (e) {
    clog(e);
  }
  try {
    const userCfgColumn = (await vim.g.get(
      "autocursor_cursorcolumn"
    )) as Cursor;
    clog({ userCfgColumn });
    const columnEvents = cfgLine.events.filter(
      (x) => !userCfgColumn.events.some((y) => y.name === x.name)
    );
    cfgColumn = {
      ...cfgColumn,
      ...userCfgColumn,
      events: [...columnEvents, ...userCfgColumn.events],
    };
    clog({ cfgColumn });
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
      if (o === cursorline) {
        cfgLine.state = s;
      }
      if (o === cursorcolumn) {
        cfgColumn.state = s;
      }
      setTimeout(async () => {
        const option = s ? o : `no${o}`;
        clog(`setOption: set ${option}`);
        await vim.execute(`set ${option}`);
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
    command! EnableAutoCursorLine call denops#notify('${vim.name}', 'changeCursor', [v:true, "cursorline"])
    command! EnableAutoCursorColumn call denops#notify('${vim.name}', 'changeCursor', [v:true, "cursorcolumn"])
    command! DisableAutoCursorLine call denops#notify('${vim.name}', 'changeCursor', [v:false, "cursorline"])
    command! DisableAutoCursorColumn call denops#notify('${vim.name}', 'changeCursor', [v:false, "cursorcolumn"])
  `);

  clog("dps-autocursor has loaded");
});
