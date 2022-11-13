let s:throttle_timers = {}

function! autocursor#util#throttle(expr, delay) abort
  if !denops#plugin#is_loaded('autocursor')
    return
  endif
  let last_exec = get(s:throttle_timers, a:expr, [0, 0])
  let timer = last_exec[0]
  let last_time = last_exec[1]
  let update_time = localtime()
  let elapsed = (update_time - last_time) * 1000
  silent! call timer_stop(timer)
  if last_time == 0
    " echom ("last_time: " .. last_time .. ", execute !")
    execute(a:expr)
  elseif elapsed > a:delay
    " echom ("last_time: " .. last_time .. ", elapsed: " .. elapsed .. ", delay: " .. a:delay .. ", execute !")
    execute(a:expr)
  else
    " echom ("last_time: " .. last_time .. ", elapsed: " .. elapsed .. ", delay: " .. a:delay .. ", delayed execute !")
    let timer = timer_start(a:delay, { -> execute(a:expr) })
    let update_time = last_time
  endif
  let s:throttle_timers[a:expr] = [timer, update_time]
endfunction
