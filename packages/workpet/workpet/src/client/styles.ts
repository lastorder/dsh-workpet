/** Stylesheet of the workpet Consumer UI (overlay pets, stage effects, configuration page). */

export const STYLE_ID = 'dsh-workpet/styles'

export const CSS = `
.wp-root{position:fixed;z-index:2147483000;width:120px;height:104px;cursor:grab;touch-action:none;user-select:none;
  -webkit-user-select:none;-webkit-app-region:no-drag;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;outline:none;}
.wp-root[data-dragging="true"]{cursor:grabbing;z-index:2147483001;}
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
.wp-label{position:absolute;top:84px;left:50%;width:max-content;max-width:144px;box-sizing:border-box;padding:3px 10px;border-radius:10px;
  font-size:11px;line-height:1.5;text-align:center;white-space:normal;overflow-wrap:anywhere;
  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;
  background:var(--dsw-alias-bg-overlay);color:var(--dsw-alias-label-primary);
  border:.5px solid var(--dsw-alias-border-l2);box-shadow:0 2px 10px rgba(0,0,0,.14);opacity:0;transform:translate(-50%,-2px);
  transition:opacity .15s ease,transform .15s ease;pointer-events:none;}
.wp-root:hover .wp-label,.wp-root:focus-visible .wp-label,.wp-root[data-alert="true"] .wp-label{opacity:1;transform:translate(-50%,0);}
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

@keyframes wp-enter{from{opacity:0;transform:translateY(6px) scale(1.25);}to{opacity:1;transform:translateY(0) scale(1.35);}}

@media (prefers-reduced-motion:reduce){.wp-root *,.wp-card-stage,.wp-card-stage *{animation:none !important;}}

.wp-config{container-type:inline-size;display:flex;flex-direction:column;gap:16px;padding:4px 0 16px;}
.wp-config-title{display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
.wp-config-head h3{margin:0;font-size:14px;font-weight:600;color:var(--dsw-alias-label-primary);}
.wp-config-count{padding:1px 8px;border-radius:999px;font-size:11px;line-height:18px;font-weight:500;
  color:var(--dsw-alias-brand-primary);background:color-mix(in srgb,var(--dsw-alias-brand-primary) 12%,transparent);}
.wp-config-source{margin-left:auto;display:inline-flex;align-items:center;gap:4px;padding:2px 10px;border-radius:999px;font-size:12px;line-height:20px;
  text-decoration:none;color:var(--dsw-alias-label-secondary);border:.5px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);
  transition:color .15s ease,border-color .15s ease;}
.wp-config-source:hover{color:var(--dsw-alias-brand-primary);border-color:var(--dsw-alias-brand-primary);}
.wp-config a:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px;border-radius:4px;}
.wp-link-arrow{flex:none;}
.wp-card-more a{display:inline-flex;align-items:center;gap:2px;font-weight:500;color:var(--dsw-alias-brand-primary);text-decoration:none;}
.wp-card-more a:hover{text-decoration:underline;}
.wp-config-head p{margin:6px 0 0;font-size:13px;line-height:1.6;color:var(--dsw-alias-label-secondary);}

.wp-gallery{display:grid;grid-template-columns:repeat(auto-fill,minmax(216px,1fr));gap:12px;}
.wp-card{display:flex;flex-direction:column;min-width:0;border-radius:14px;overflow:hidden;
  border:.5px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);box-shadow:0 1px 3px rgba(0,0,0,.06);}
.wp-card-scene{position:relative;height:164px;display:flex;align-items:flex-end;justify-content:center;padding-bottom:16px;box-sizing:border-box;
  background:radial-gradient(120% 70% at 50% 100%,color-mix(in srgb,var(--dsw-alias-brand-primary) 12%,transparent),transparent 70%),var(--dsw-alias-bg-layer-2);}
.wp-card-scene::after{content:"";position:absolute;left:50%;bottom:12px;width:96px;height:10px;margin-left:-48px;border-radius:50%;
  background:radial-gradient(closest-side,rgba(0,0,0,.16),transparent);pointer-events:none;}
.wp-card-stage{position:relative;z-index:1;width:100px;height:80px;flex:none;transform:scale(1.35);transform-origin:50% 100%;
  animation:wp-enter .28s ease-out;}
.wp-card-bubble{position:absolute;z-index:2;top:10px;left:50%;transform:translateX(-50%);max-width:calc(100% - 24px);box-sizing:border-box;
  padding:3px 10px;border-radius:999px;font-size:11px;line-height:1.5;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
  background:var(--dsw-alias-bg-overlay);color:var(--dsw-alias-label-primary);border:.5px solid var(--dsw-alias-border-l2);
  box-shadow:0 2px 8px rgba(0,0,0,.10);}
.wp-card-bubble[data-tone="warn"]{color:var(--dsw-alias-state-warn-primary);}
.wp-card-bubble[data-tone="error"]{color:var(--dsw-alias-state-error-primary);}
.wp-card-bubble[data-tone="done"]{color:var(--dsw-alias-state-success-primary);}
.wp-card-body{padding:10px 12px 12px;border-top:.5px solid var(--dsw-alias-border-l1);}
.wp-card-body h4{margin:0;font-size:13px;font-weight:600;color:var(--dsw-alias-label-primary);}
.wp-card-body p{margin:4px 0 0;font-size:12px;line-height:1.5;color:var(--dsw-alias-label-secondary);
  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
.wp-card-more{align-items:center;justify-content:center;gap:8px;min-height:120px;padding:16px;text-align:center;box-sizing:border-box;
  border:1px dashed var(--dsw-alias-border-l2);background:transparent;box-shadow:none;}
.wp-card-more p{margin:0;font-size:12px;line-height:1.6;color:var(--dsw-alias-label-secondary);}
.wp-card-more-glyph{display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:999px;font-size:16px;
  color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-bg-layer-2);}
.wp-card-more[data-empty="true"]{grid-column:1/-1;}

.wp-actions{display:flex;flex-direction:column;gap:10px;padding:14px;border-radius:14px;
  border:.5px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);}
.wp-actions-head{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap;margin-bottom:2px;}
.wp-actions-head h4{margin:0;font-size:13px;font-weight:600;color:var(--dsw-alias-label-primary);}
.wp-actions-head span{font-size:12px;color:var(--dsw-alias-label-secondary);}
.wp-chip-group{display:grid;grid-template-columns:76px minmax(0,1fr);align-items:start;gap:8px;}
.wp-chip-group[data-variant]{padding-top:10px;border-top:.5px dashed var(--dsw-alias-border-l2);}
.wp-chip-group-label{padding-top:7px;font-size:12px;color:var(--dsw-alias-label-secondary);}
.wp-chips{display:flex;flex-wrap:wrap;gap:6px;}
.wp-chip{display:inline-flex;align-items:center;gap:6px;height:30px;padding:0 12px 0 10px;border-radius:999px;box-sizing:border-box;
  border:.5px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);
  font:inherit;font-size:12px;line-height:1;cursor:pointer;white-space:nowrap;
  transition:background-color .15s ease,border-color .15s ease,color .15s ease,box-shadow .15s ease,transform .1s ease;}
.wp-chip:hover{border-color:color-mix(in srgb,var(--dsw-alias-brand-primary) 55%,var(--dsw-alias-border-l2));}
.wp-chip:active{transform:scale(.97);}
.wp-chip:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px;}
.wp-chip[aria-pressed="true"]{border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-brand-primary);font-weight:600;
  background:color-mix(in srgb,var(--dsw-alias-brand-primary) 14%,var(--dsw-alias-bg-layer-1));
  box-shadow:0 0 0 3px color-mix(in srgb,var(--dsw-alias-brand-primary) 16%,transparent);}
.wp-chip[data-variant]{width:30px;padding:0;justify-content:center;}
.wp-chip-glyph{font-size:14px;line-height:1;}
@container (max-width:480px){.wp-chip-group{grid-template-columns:minmax(0,1fr);gap:4px;}.wp-chip-group-label{padding-top:0;}}
`
