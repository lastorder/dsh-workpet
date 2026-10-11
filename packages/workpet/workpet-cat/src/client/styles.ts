/** Stylesheet of the cat skin; every class is prefixed `wpc-`. */

export const STYLE_ID = 'dsh-workpet-cat/styles'

export const CSS = `
.wpc{overflow:visible;}
.wpc-blink{animation:wpc-blink 4.4s ease-in-out infinite;transform-box:fill-box;transform-origin:center;}
.wpc-look{animation:wpc-look 3.6s ease-in-out infinite;}
.wpc-spin{animation:wpc-spin 1.1s linear infinite;}
.wpc-drip{animation:wpc-drip 1.6s ease-in infinite;}
.wpc-breathe{animation:wpc-breathe 3s ease-in-out infinite;}
.wpc-breathe-slow{animation:wpc-breathe 4.2s ease-in-out infinite;}
.wpc-tail{animation:wpc-tail 2.4s ease-in-out infinite;}
.wpc-tail-flick{animation:wpc-tail-flick .9s ease-in-out infinite;}
.wpc-tail-run{animation:wpc-tail-run .34s ease-in-out infinite;}
.wpc-bob{animation:wpc-bob .34s ease-in-out infinite;}
.wpc-leg-a{animation:wpc-leg-a .34s ease-in-out infinite;}
.wpc-leg-b{animation:wpc-leg-b .34s ease-in-out infinite;}
.wpc-flutter{animation:wpc-flutter .3s ease-in-out infinite;}
.wpc-leaf{animation:wpc-leaf 1.8s linear infinite;}
.wpc-type{animation:wpc-type .22s ease-in-out infinite alternate;}
.wpc-glow{animation:wpc-glow 2s ease-in-out infinite;}
.wpc-code{stroke-dasharray:12;animation:wpc-code 1.5s steps(6) infinite;}
.wpc-wave{animation:wpc-wave .7s ease-in-out infinite;}
.wpc-nudge{animation:wpc-nudge 1s ease-in-out infinite;}
.wpc-ponder{animation:wpc-ponder 3s ease-in-out infinite;}
.wpc-wobble{animation:wpc-wobble .6s ease-in-out infinite;}
.wpc-jump{animation:wpc-jump 1.1s cubic-bezier(.4,0,.2,1) infinite;}
.wpc-shake{animation:wpc-shake .5s ease-in-out 3;}
.wpc-purr{animation:wpc-purr .18s linear infinite;}
.wpc-swing{animation:wpc-swing 1.3s ease-in-out infinite;}
.wpc-kick{animation:wpc-kick .45s ease-in-out infinite;}

@keyframes wpc-blink{0%,93%,100%{transform:scaleY(1);}96%{transform:scaleY(.1);}}
@keyframes wpc-look{0%,40%,100%{transform:translateX(0);}50%,70%{transform:translateX(-1.6px);}80%,90%{transform:translateX(1.6px);}}
@keyframes wpc-spin{from{transform:rotate(0deg);}to{transform:rotate(360deg);}}
@keyframes wpc-drip{0%{transform:translateY(0);opacity:1;}100%{transform:translateY(5px);opacity:0;}}
@keyframes wpc-breathe{0%,100%{transform:scale(1,1);}50%{transform:scale(1.012,1.03);}}
@keyframes wpc-tail{0%,100%{transform:rotate(0deg);}50%{transform:rotate(-9deg);}}
@keyframes wpc-tail-flick{0%,100%{transform:rotate(0deg);}50%{transform:rotate(-14deg);}}
@keyframes wpc-tail-run{0%,100%{transform:rotate(-6deg);}50%{transform:rotate(10deg);}}
@keyframes wpc-bob{0%,100%{transform:translateY(0);}50%{transform:translateY(-2.6px);}}
@keyframes wpc-leg-a{0%,100%{transform:rotate(28deg);}50%{transform:rotate(-28deg);}}
@keyframes wpc-leg-b{0%,100%{transform:rotate(-28deg);}50%{transform:rotate(28deg);}}
@keyframes wpc-flutter{0%,100%{transform:rotate(-8deg) scaleX(1);}50%{transform:rotate(10deg) scaleX(.85);}}
@keyframes wpc-leaf{0%{transform:translate(20px,-6px) rotate(0deg);opacity:0;}15%{opacity:1;}100%{transform:translate(-14px,8px) rotate(-220deg);opacity:0;}}
@keyframes wpc-type{from{transform:translateY(0);}to{transform:translateY(1.6px);}}
@keyframes wpc-glow{0%,100%{opacity:.85;}50%{opacity:1;}}
@keyframes wpc-code{from{stroke-dashoffset:12;}to{stroke-dashoffset:0;}}
@keyframes wpc-wave{0%,100%{transform:rotate(4deg);}50%{transform:rotate(-22deg);}}
@keyframes wpc-nudge{0%,100%{transform:translateY(0);}35%{transform:translateY(-3px);}}
@keyframes wpc-ponder{0%,100%{transform:rotate(0deg);}50%{transform:rotate(-2.5deg);}}
@keyframes wpc-wobble{0%,100%{transform:rotate(-6deg);}50%{transform:rotate(6deg);}}
@keyframes wpc-jump{0%,100%{transform:translateY(0) scale(1,1);}18%{transform:translateY(0) scale(1.08,.9);}48%{transform:translateY(-14px) scale(.95,1.06);}75%{transform:translateY(0) scale(1.05,.95);}}
@keyframes wpc-shake{0%,100%{transform:translateX(0) rotate(0deg);}25%{transform:translateX(-2.4px) rotate(-2deg);}75%{transform:translateX(2.4px) rotate(2deg);}}
@keyframes wpc-purr{0%,100%{transform:translate(0,0);}25%{transform:translate(.35px,0);}75%{transform:translate(-.35px,0);}}
@keyframes wpc-swing{0%,100%{transform:rotate(-7deg);}50%{transform:rotate(7deg);}}
@keyframes wpc-kick{0%,100%{transform:rotate(-8deg);}50%{transform:rotate(10deg);}}

@media (prefers-reduced-motion:reduce){.wpc *{animation:none !important;}}
`
