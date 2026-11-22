# tiny-stack-vm-01 — a tiny stack virtual machine

[![Tiny Stack VM 01](https://make.fun/badge/tiny-stack-vm-01-run-20261122.svg)](https://make.fun/bounty/tiny-stack-vm-01-run-20261122?utm_source=github&utm_medium=readme&utm_campaign=tiny-stack-vm-01-run-20261122)
[![Rank](https://make.fun/badge/tiny-stack-vm-01-run-20261122/Kojeck86/tiny-stack-vm-01-run-20261122/rank.svg)](https://make.fun/bounty/tiny-stack-vm-01-run-20261122/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=tiny-stack-vm-01-run-20261122)
[![Reward](https://make.fun/badge/tiny-stack-vm-01-run-20261122/Kojeck86/tiny-stack-vm-01-run-20261122/reward.svg)](https://make.fun/bounty/tiny-stack-vm-01-run-20261122?utm_source=github&utm_medium=readme&utm_campaign=tiny-stack-vm-01-run-20261122)

Entry for [tiny-stack-vm-01-run-20261122](https://make.fun/bounty/tiny-stack-vm-01-run-20261122):
a tiny stack virtual machine for make.fun's tiny stack ISA v1. `main.ts`
(plain JavaScript, Node 22, no dependencies) runs each instance's
`program.bin` with its `input.bin` and writes the bytes the program wrote
plus its exit code. 32-bit wrapping arithmetic, a 256-value data stack, a
64-deep call stack, 256 words of memory, and all ten traps with their exact
exit codes. Two runs on the same set write byte-identical answers.
Practice set: 40/40, score 1,000,000.
