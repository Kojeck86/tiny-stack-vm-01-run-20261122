// Tiny stack VM: make.fun tiny-stack-vm-01 ISA v1. Reads /input/i001..i040,
// writes /output/<id>/{stdout.bin,exit.txt}. Plain JS in a .ts file; Node 22
// runs it as-is, nothing installed. Deterministic: no clock, env, or randomness.
import {mkdirSync as M,readFileSync as R,writeFileSync as W} from 'node:fs';
// Stack effect per opcode: hex digit per opcode byte, pops*4+pushes.
const P=new Uint8Array(84),Q=new Uint8Array(84);
'01146abf0000000099999995999599909990000000000000044000000000000058000000000000004414'.split('').forEach((c,o)=>{const v=parseInt(c,16);P[o]=v>>2;Q[o]=v&3});
const V=o=>o<8||o>15&&o<31||o>31&&o<35||o>47&&o<53||o>63&&o<66||o>79&&o<84;
function run(p,inp){
  const mem=new Int32Array(256),st=new Int32Array(257),cs=new Int32Array(64),out=[];
  const n=p.length;
  let sp=0,csp=0,pc=0,steps=0,ip=0;
  for(;;){
    if(steps>=1000000)return{exit:10,out}; // step limit
    if(pc<0||pc>=n)return{exit:9,out}; // pc outside the program
    const op=p[pc];
    if(!V(op))return{exit:5,out}; // unknown opcode
    // Instruction length: PUSH32 1+4, PUSH8 1+1, jumps/CALL 1+2, rest 1.
    const len=op===2?5:op===1?2:op>=48&&op<=51?3:1;
    if(pc+len>n)return{exit:9,out}; // immediate cut off by the end
    let imm=0;
    if(op===1)imm=(p[pc+1]<<24)>>24; // PUSH8: sign-extended
    else if(op===2)imm=p[pc+1]|p[pc+2]<<8|p[pc+3]<<16|p[pc+4]<<24;
    else if(op===51)imm=p[pc+1]|p[pc+2]<<8; // CALL: unsigned
    else if(op>=48&&op<=50){imm=p[pc+1]|p[pc+2]<<8;if(imm&32768)imm-=65536;} // JMP/JZ/JNZ: signed
    if(sp<P[op])return{exit:2,out}; // stack underflow
    if(sp-P[op]+Q[op]>256)return{exit:3,out}; // stack overflow
    steps++;
    let npc=pc+len,a,b;
    switch(op){
      case 0:return{exit:0,out}; // HALT
      case 1:case 2:st[sp++]=imm;break; // PUSH8/PUSH32
      case 3:sp--;break; // POP
      case 4:st[sp]=st[sp-1];sp++;break; // DUP
      case 5:a=st[sp-1];st[sp-1]=st[sp-2];st[sp-2]=a;break; // SWAP
      case 6:st[sp]=st[sp-2];sp++;break; // OVER
      case 7:a=st[sp-3];st[sp-3]=st[sp-2];st[sp-2]=st[sp-1];st[sp-1]=a;break; // ROT
      case 16:b=st[--sp];st[sp-1]=(st[sp-1]+b)|0;break; // ADD
      case 17:b=st[--sp];st[sp-1]=(st[sp-1]-b)|0;break; // SUB
      case 18:b=st[--sp];st[sp-1]=Math.imul(st[sp-1],b);break; // MUL (low 32 bits)
      case 19:b=st[--sp];if(!b)return{exit:4,out};st[sp-1]=(st[sp-1]/b)|0;break; // DIV
      case 20:b=st[--sp];if(!b)return{exit:4,out};st[sp-1]=st[sp-1]%b;break; // MOD
      case 21:b=st[--sp];if(!b)return{exit:4,out};st[sp-1]=(st[sp-1]>>>0)/(b>>>0)|0;break; // DIVU
      case 22:b=st[--sp];if(!b)return{exit:4,out};st[sp-1]=(st[sp-1]>>>0)%(b>>>0)|0;break; // MODU
      case 23:st[sp-1]=(-st[sp-1])|0;break; // NEG
      case 24:b=st[--sp];st[sp-1]=st[sp-1]&b;break; // AND
      case 25:b=st[--sp];st[sp-1]=st[sp-1]|b;break; // OR
      case 26:b=st[--sp];st[sp-1]=st[sp-1]^b;break; // XOR
      case 27:st[sp-1]=~st[sp-1];break; // NOT
      case 28:b=st[--sp];st[sp-1]=st[sp-1]<<(b&31);break; // SHL
      case 29:b=st[--sp];st[sp-1]=st[sp-1]>>(b&31);break; // SHR (arithmetic)
      // SHRU: >>> is the logical shift; (a>>>0)>>k would re-sign a first.
      case 30:b=st[--sp];st[sp-1]=(st[sp-1]>>>(b&31))|0;break;
      case 32:b=st[--sp];st[sp-1]=st[sp-1]===b?1:0;break; // EQ
      case 33:b=st[--sp];st[sp-1]=st[sp-1]<b?1:0;break; // LT (signed)
      case 34:b=st[--sp];st[sp-1]=(st[sp-1]>>>0)<(b>>>0)?1:0;break; // LTU
      case 48:npc+=imm;break; // JMP
      case 49:if(!st[--sp])npc+=imm;break; // JZ
      case 50:if(st[--sp])npc+=imm;break; // JNZ
      case 51:if(csp>=64)return{exit:7,out};cs[csp++]=npc;npc=imm;break; // CALL
      case 52:if(!csp)return{exit:8,out};npc=cs[--csp];break; // RET
      case 64:a=st[sp-1];if(a<0||a>255)return{exit:6,out};st[sp-1]=mem[a];break; // LOAD
      case 65:a=st[--sp];b=st[--sp];if(a<0||a>255)return{exit:6,out};mem[a]=b;break; // STORE
      case 80:{const s=String(st[--sp]);if(out.length+s.length>65536)return{exit:11,out};for(let i=0;i<s.length;i++)out.push(s.charCodeAt(i));break;} // PRINT
      case 81:if(out.length>65535)return{exit:11,out};out.push(st[--sp]&255);break; // PUTC
      case 82:st[sp++]=ip<inp.length?inp[ip++]:-1;break; // IN
      case 83:return{exit:st[--sp]&255,out}; // EXIT
    }
    pc=npc;
  }
}
for(let k=1;k<=40;k++){
  const id='i'+String(k).padStart(3,'0');
  const r=run(R('/input/'+id+'/program.bin'),R('/input/'+id+'/input.bin'));
  M('/output/'+id,{recursive:true});
  W('/output/'+id+'/stdout.bin',Buffer.from(r.out));
  W('/output/'+id+'/exit.txt',r.exit+'\n');
}
