// =============================================================================
// File        : main.ts
// Author      : yukimemi
// Last Change : 2024/08/04 00:24:15.
// =============================================================================

import * as autocmd from "jsr:@denops/std@8.0.0/autocmd";
import * as helper from "jsr:@denops/std@8.0.0/helper";
import * as op from "jsr:@denops/std@8.0.0/option";
import * as vars from "jsr:@denops/std@8.0.0/variable";
import type { Denops } from "jsr:@denops/std@8.0.0";
import { z } from "npm:zod@4.1.11";

const version = "20240804_002415";
const lineWait = 100;
const columnWait = 100;

const LineOrColumnSchema = z.literal("cursorline").or(z.literal("cursorcolumn"));
type LineOrColumn = z.infer<typeof LineOrColumnSchema>;

const AutocmdEventSchema = z.any().transform((v) => v as autocmd.AutocmdEvent);
const EventSchema = z.object({
  name: z.union([AutocmdEventSchema, z.array(AutocmdEventSchema)]),
  set: z.boolean(),
  wait: z.number(),
});
type Event = z.infer<typeof EventSchema>;

const CursorSchema = z.object({
  enable: z.boolean(),
  option: LineOrColumnSchema.optional(),
  state: z.boolean().default(false),
  events: z.array(EventSchema),
});
type Cursor = z.infer<typeof CursorSchema>;

let cfgLine: Cursor = {
  enable: true,
  option: "cursorline",
  state: false,
  events: [
    {
      name: ["CursorHold", "CursorHoldI"],
      set: true,
      wait: lineWait,
    },
    {
      name: ["WinEnter", "BufEnter"],
      set: true,
      wait: 0,
    },
    {
      name: ["CursorMoved", "CursorMovedI"],
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
      name: ["CursorHold", "CursorHoldI"],
      set: true,
      wait: columnWait,
    },
    {
      name: ["WinEnter", "BufEnter"],
      set: true,
      wait: 0,
    },
    {
      name: ["CursorMoved", "CursorMovedI"],
      set: false,
      wait: 0,
    },
  ],
};

let ignoreFileTypes = [
  "ctrlp",
  "ddu-ff",
  "ddu-ff-filter",
  "ddu-filer",
  "dpswalk",
  "list",
  "qf",
  "quickfix",
];

function uniqueEvent(events: Event[]): Event[] {
  const unique = new Set();
  return events
    .map((event) =>
      Array.isArray(event.name)
        ? event.name.map((name) => ({ name, set: event.set, wait: event.wait }))
        : [event]
    )
    .flat()
    .filter((event) => {
      const key = `${event.name}-${event.set}-${event.wait}`;
      return !unique.has(key) && unique.add(key);
    });
}

const throttles: Record<string, [number, number]> = {};

function throttle(id: string, fn: () => void, delay: number, wait: number) {
  const last = throttles[id] || [0, 0];
  let lastTimerId = last[0];
  const lastTime = last[1];
  let updateTime = (new Date()).getTime();
  const elapsed = updateTime - lastTime;
  const threshold = delay + wait;
  clearTimeout(lastTimerId);
  if (elapsed > threshold) {
    fn();
  } else {
    lastTimerId = setTimeout(fn, threshold);
    updateTime = lastTime;
  }
  throttles[id] = [lastTimerId, updateTime];
}

async function notifyMsg(denops: Denops, msg: string, notify = false) {
  if (notify && denops.meta.host === "nvim") {
    await helper.execute(
      denops,
      `lua vim.notify([[${msg}]], vim.log.levels.INFO)`,
    );
  }
}

export async function main(denops: Denops): Promise<void> {
  // debug.
  const debug = await vars.g.get(denops, "autocursor_debug", false);
  const notify = await vars.g.get(denops, "autocursor_notify", false);
  // fix state interval.
  const fixInterval = await vars.g.get(denops, "autocursor_fix_interval", 5000);
  // throttle.
  const throttleTime = await vars.g.get(denops, "autocursor_throttle", 300);
  // deno-lint-ignore no-explicit-any
  const clog = (...data: any[]): void => {
    if (debug) {
      console.log(...data);
    }
  };

  // Disable the default settings if the user has configured them.
  cfgLine = CursorSchema.parse(await vars.g.get(denops, "autocursor_cursorline", cfgLine));
  cfgLine = {
    ...cfgLine,
    option: "cursorline",
    state: false,
    events: uniqueEvent(cfgLine.events),
  };

  cfgColumn = CursorSchema.parse(await vars.g.get(denops, "autocursor_cursorcolumn", cfgColumn));
  cfgColumn = {
    ...cfgColumn,
    option: "cursorcolumn",
    state: false,
    events: uniqueEvent(cfgColumn.events),
  };

  ignoreFileTypes = await vars.g.get(
    denops,
    "autocursor_ignore_filetypes",
    ignoreFileTypes,
  );

  clog({
    debug,
    fixInterval,
    throttleTime,
    cfgLine,
    cfgColumn,
    ignoreFileTypes,
  });

  denops.dispatcher = {
    // deno-lint-ignore require-await
    async setOption(
      set: unknown,
      wait: unknown,
      option: unknown,
    ): Promise<void> {
      try {
        const opt: LineOrColumn = LineOrColumnSchema.parse(option);
        const waitParsed = z.number().parse(wait);
        throttle(
          opt,
          async () => {
            const setParsed = z.boolean().parse(set);
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
            const ft = await op.filetype.get(denops);
            if (ignoreFileTypes.some((x) => x === ft)) {
              clog(`ft is [${ft}], so skip !`);
              return;
            }
            if (opt === "cursorline") {
              cfgLine.state = setParsed;
            }
            if (opt === "cursorcolumn") {
              cfgColumn.state = setParsed;
            }
            if (set) {
              clog(`setOption: set ${option}`);
              await op[opt].set(denops, true);
              await notifyMsg(denops, `set ${option}`, notify);
            } else {
              clog(`setOption: set no${option}`);
              await op[opt].set(denops, false);
              await notifyMsg(denops, `set no${option}`, notify);
            }
          },
          throttleTime,
          waitParsed,
        );
      } catch (e) {
        clog(e);
      }
    },

    async changeCursor(enable: unknown, option: unknown): Promise<void> {
      const enableParsed = z.boolean().parse(enable);
      const opt: LineOrColumn = LineOrColumnSchema.parse(option);
      if (!enable) {
        clog(`set no${opt}`);
        await op[opt].set(denops, false);
      }
      if (opt === "cursorline") {
        cfgLine.enable = enableParsed;
      }
      if (opt === "cursorcolumn") {
        cfgColumn.enable = enableParsed;
      }
    },

    // deno-lint-ignore require-await
    async fixState(interval: unknown): Promise<void> {
      const intervalParsed = z.number().parse(interval);
      setInterval(async () => {
        cfgLine.state = (await op.cursorline.get(denops)) ? true : false;
        cfgColumn.state = (await op.cursorcolumn.get(denops)) ? true : false;
        clog(
          `Fix state. line: [${cfgLine.state}], column: [${cfgColumn.state}]`,
        );
      }, intervalParsed);
    },
  };

  await helper.execute(
    denops,
    `
    function! s:${denops.name}_notify(method, params) abort
      call denops#plugin#wait_async('${denops.name}', function('denops#notify', ['${denops.name}', a:method, a:params]))
    endfunction
    command! EnableAutoCursorLine call s:${denops.name}_notify('changeCursor', [v:true, "cursorline"])
    command! EnableAutoCursorColumn call s:${denops.name}_notify('changeCursor', [v:true, "cursorcolumn"])
    command! DisableAutoCursorLine call s:${denops.name}_notify('changeCursor', [v:false, "cursorline"])
    command! DisableAutoCursorColumn call s:${denops.name}_notify('changeCursor', [v:false, "cursorcolumn"])
  `,
  );

  await autocmd.group(denops, "autocursor", (helper) => {
    helper.remove();
    [cfgLine, cfgColumn].forEach((cfg) => {
      cfg.events.forEach((e) => {
        helper.define(
          e.name,
          "*",
          `call s:${denops.name}_notify('setOption', [${
            e.set ? "v:true" : "v:false"
          }, ${e.wait}, '${cfg.option}'])`,
        );
      });
    });
    helper.define(
      `User`,
      `DenopsPluginPost:${denops.name}`,
      `call s:${denops.name}_notify('fixState', [${fixInterval}])`,
    );
  });

  clog(`autocursor.vim has loaded. ver: ${version}`);
}
