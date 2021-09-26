import { merge } from "https://cdn.skypack.dev/lodash@4.17.21";
import * as autocmd from "https://deno.land/x/denops_std@v2.0.0/autocmd/mod.ts";
import * as helper from "https://deno.land/x/denops_std@v2.0.0/helper/mod.ts";
import * as op from "https://deno.land/x/denops_std@v2.0.0/option/mod.ts";
import * as vars from "https://deno.land/x/denops_std@v2.0.0/variable/mod.ts";
import type { Denops } from "https://deno.land/x/denops_std@v2.0.0/mod.ts";
import { Lock } from "https://deno.land/x/async@v1.1.3/mod.ts";
import {
  ensureBoolean,
  ensureNumber,
} from "https://deno.land/x/unknownutil@v1.1.2/mod.ts";

const lineWait = 100;
const columnWait = 100;

type LineOrColumn = "cursorline" | "cursorcolumn";

type Event = {
  name: autocmd.AutocmdEvent;
  set: boolean;
  wait: number;
};

type Cursor = {
  enable: boolean;
  option: LineOrColumn;
  state: boolean;
  events: Event[];
};

let cfgLine: Cursor = {
  enable: true,
  option: "cursorline",
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
  option: "cursorcolumn",
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

const lock = new Lock();

export async function main(denops: Denops): Promise<void> {
  // debug.
  const debug = await vars.g.get(denops, "autocursor_debug", false);
  // deno-lint-ignore no-explicit-any
  const clog = (...data: any[]): void => {
    if (debug) {
      console.log(...data);
    }
  };

  // Merge user option.
  const userCfgLine =
    (await vars.g.get(denops, "autocursor_cursorline")) as Cursor;
  const userCfgColumn =
    (await vars.g.get(denops, "autocursor_cursorcolumn")) as Cursor;

  cfgLine = merge(cfgLine, userCfgLine);
  cfgColumn = merge(cfgColumn, userCfgColumn);
  clog({ cfgLine, cfgColumn });

  denops.dispatcher = {
    async setOption(
      set: unknown,
      wait: unknown,
      option: unknown,
    ): Promise<void> {
      try {
        ensureNumber(wait);
        ensureBoolean(set);
        const opt = option as LineOrColumn;
        if (opt === "cursorline") {
          if (set === cfgLine.state || !cfgLine.enable) {
            clog(
              `setOption: cfgLine.state: ${cfgLine.state}, cfgLine.enable: ${cfgLine.enable} so return.`,
            );
            return;
          }
        }
        if (opt === "cursorcolumn") {
          if (set === cfgColumn.state || !cfgColumn.enable) {
            clog(
              `setOption: cfgColumn.state: ${cfgColumn.state}, cfgColumn.enable: ${cfgColumn.enable} so return.`,
            );
            return;
          }
        }
        await lock.with(() => {
          if (opt === "cursorline") {
            cfgLine.state = set;
          }
          if (opt === "cursorcolumn") {
            cfgColumn.state = set;
          }
          setTimeout(async () => {
            if (set) {
              clog(`setOption: set ${option}`);
              await op[opt].set(denops, true);
            } else {
              clog(`setOption: set no${option}`);
              await op[opt].set(denops, false);
            }
          }, wait);
        });
      } catch (e) {
        clog(e);
      }
    },

    async changeCursor(enable: unknown, option: unknown): Promise<void> {
      ensureBoolean(enable);
      const opt = option as LineOrColumn;
      if (!enable) {
        clog(`set no${opt}`);
        await op[opt].set(denops, false);
      }
      if (opt === "cursorline") {
        cfgLine.enable = enable;
      }
      if (opt === "cursorcolumn") {
        cfgColumn.enable = enable;
      }
    },
  };

  await autocmd.group(denops, "autocursor", (helper) => {
    helper.remove();
    [cfgLine, cfgColumn].forEach((cfg) => {
      cfg.events.forEach((e) => {
        helper.define(
          e.name,
          "*",
          `call denops#notify('${denops.name}', 'setOption', [${
            e.set ? "v:true" : "v:false"
          }, ${e.wait}, '${cfg.option}'])`,
        );
      });
    });
  });

  await helper.execute(
    denops,
    `
    command! EnableAutoCursorLine call denops#notify('${denops.name}', 'changeCursor', [v:true, "cursorline"])
    command! EnableAutoCursorColumn call denops#notify('${denops.name}', 'changeCursor', [v:true, "cursorcolumn"])
    command! DisableAutoCursorLine call denops#notify('${denops.name}', 'changeCursor', [v:false, "cursorline"])
    command! DisableAutoCursorColumn call denops#notify('${denops.name}', 'changeCursor', [v:false, "cursorcolumn"])
  `,
  );

  clog("dps-autocursor has loaded");
}
