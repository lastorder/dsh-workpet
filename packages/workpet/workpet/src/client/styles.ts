/** Stylesheet of the workpet Consumer UI (overlay, stage effects, configuration page). */

export const STYLE_ID = 'dsh-workpet/styles'

export const CSS = `
.wp-root{position:fixed;z-index:2147483000;width:120px;height:104px;cursor:grab;touch-action:none;user-select:none;
  -webkit-user-select:none;-webkit-app-region:no-drag;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;outline:none;}
.wp-root[data-dragging="true"]{cursor:grabbing;}
.wp-root:focus-visible .wp-stage{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:4px;border-radius:12px;}
.wp-stage{position:relative;width:100px;height:80px;flex:none;}
.wp-figure{position:absolute;inset:0;}
.wp-figure svg{display:block;width:100%;height:100%;overflow:visible;}
.wp-companion{position:absolute;bottom:0;width:42px;height:34px;opacity:.9;pointer-events:none;animation:wp-hop .9s ease-in-out infinite;}
.wp-companion[data-side="left"]{left:-30px;}
.wp-companion[data-side="right"]{right:-30px;animation-delay:-.45s;}
.wp-badge{position:absolute;right:-6px;top:-6px;width:24px;height:24px;border-radius:999px;display:flex;align-items:center;justify-content:center;
  font-size:13px;line-height:1;background:var(--dsw-alias-bg-overlay);border:.5px solid var(--dsw-alias-border-l2);
  box-shadow:0 2px 6px rgba(0,0,0,.16);animation:wp-pop .25s ease-out;}
.wp-effects{position:absolute;inset:0;pointer-events:none;overflow:visible;}
.wp-fx{position:absolute;font-weight:700;line-height:1;}
.wp-fx-z{color:var(--dsw-alias-label-secondary);animation:wp-float-z 2.8s ease-in infinite;}
.wp-fx-heart{animation:wp-float-up 1.4s ease-out infinite;}
.wp-fx-spark{animation:wp-twinkle 1s ease-in-out infinite;}
.wp-fx-bubble{display:flex;align-items:center;justify-content:center;min-width:20px;height:20px;padding:0 5px;border-radius:999px;
  font-size:13px;background:var(--dsw-alias-bg-overlay);color:var(--dsw-alias-label-primary);
  border:.5px solid var(--dsw-alias-border-l2);box-shadow:0 2px 6px rgba(0,0,0,.14);animation:wp-nudge 1s ease-in-out infinite;}
.wp-fx-bubble[data-tone="warn"]{color:var(--dsw-alias-state-warn-primary);}
.wp-fx-bubble[data-tone="error"]{color:var(--dsw-alias-state-error-primary);}
.wp-fx-dots span{display:inline-block;width:4px;height:4px;margin:0 1px;border-radius:50%;background:currentColor;animation:wp-dot 1.2s ease-in-out infinite;}
.wp-fx-dots span:nth-child(2){animation-delay:.2s;}
.wp-fx-dots span:nth-child(3){animation-delay:.4s;}
.wp-label{margin-top:4px;max-width:220px;padding:3px 10px;border-radius:999px;font-size:11px;line-height:1.5;white-space:nowrap;
  overflow:hidden;text-overflow:ellipsis;background:var(--dsw-alias-bg-overlay);color:var(--dsw-alias-label-primary);
  border:.5px solid var(--dsw-alias-border-l2);box-shadow:0 2px 10px rgba(0,0,0,.14);opacity:0;transform:translateY(-2px);
  transition:opacity .15s ease,transform .15s ease;pointer-events:none;}
.wp-root:hover .wp-label,.wp-root:focus-visible .wp-label,.wp-root[data-alert="true"] .wp-label{opacity:1;transform:translateY(0);}
.wp-label[data-tone="warn"]{color:var(--dsw-alias-state-warn-primary);}
.wp-label[data-tone="error"]{color:var(--dsw-alias-state-error-primary);}
.wp-label[data-tone="done"]{color:var(--dsw-alias-state-success-primary);}

@keyframes wp-hop{0%,100%{transform:translateY(0);}50%{transform:translateY(-3px);}}
@keyframes wp-pop{from{transform:scale(.4);opacity:0;}to{transform:scale(1);opacity:1;}}
@keyframes wp-float-z{0%{opacity:0;transform:translate(0,0) scale(.6);}20%{opacity:1;}100%{opacity:0;transform:translate(10px,-20px) scale(1.2);}}
@keyframes wp-float-up{0%{opacity:0;transform:translateY(0) scale(.5);}25%{opacity:1;}100%{opacity:0;transform:translateY(-24px) scale(1.1);}}
@keyframes wp-twinkle{0%,100%{opacity:.25;transform:scale(.7) rotate(0deg);}50%{opacity:1;transform:scale(1.15) rotate(20deg);}}
@keyframes wp-nudge{0%,100%{transform:translateY(0);}50%{transform:translateY(-3px);}}
@keyframes wp-dot{0%,100%{opacity:.25;}50%{opacity:1;}}

@media (prefers-reduced-motion:reduce){.wp-root *,.wp-config-stage *{animation:none !important;}}

.wp-config{display:flex;flex-direction:column;gap:12px;padding:4px 0 16px;}
.wp-config-head h3{margin:0;font-size:14px;font-weight:600;color:var(--dsw-alias-label-primary);}
.wp-config-head p{margin:4px 0 0;font-size:13px;line-height:1.5;color:var(--dsw-alias-label-secondary);}
.wp-config-card{display:flex;gap:16px;align-items:stretch;padding:12px;border-radius:12px;
  border:.5px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);}
.wp-config-fields{flex:1;min-width:0;display:flex;flex-direction:column;}
.wp-config-field{display:flex;flex-direction:column;gap:6px;padding:8px 0;}
.wp-config-field + .wp-config-field{border-top:.5px solid var(--dsw-alias-border-l2);}
.wp-config-field label{font-size:13px;font-weight:500;color:var(--dsw-alias-label-primary);}
.wp-config-field select{padding:6px 12px;border:.5px solid var(--dsw-alias-border-l2);border-radius:8px;
  background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);font:inherit;font-size:13px;}
.wp-config-field select:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px;}
.wp-config-field p{margin:0;font-size:12px;line-height:1.5;color:var(--dsw-alias-label-secondary);}
.wp-config-field p[data-tone="warn"]{color:var(--dsw-alias-state-warn-primary);}
.wp-config-preview{flex:none;width:168px;display:flex;align-items:center;justify-content:center;border-radius:10px;
  background:var(--dsw-alias-bg-layer-2);}
.wp-config-stage{position:relative;width:100px;height:80px;margin:24px 34px 16px;}
.wp-config-empty{margin:0;font-size:13px;color:var(--dsw-alias-label-secondary);}
`
