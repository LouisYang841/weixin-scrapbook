import type { SurfaceMap } from './book/surface-map';
import {mountViewer} from './book/viewer';
import type {BookController} from './book/desktop.js';
import {makePages,entries,source} from './scrapbook-pages';
import './scrapbook.css';
const root=document.querySelector<HTMLDivElement>('#app')!;
root.innerHTML=`<header><a class="wordmark" href="./"><span class="mark">紙</span><span>纸间收藏室<small>PAPER KEEPSAKES / VOL. 01</small></span></a><button id="contents" class="subtle">▦ <span>翻看目录</span></button></header>
<section class="intro"><div class="eyebrow">A SCRAPBOOK OF LITTLE JOYS</div><h1>把喜欢，贴进纸里<span>。</span></h1><p>一页生日的甜，一笔陪伴的线，一点蓝色的小心情。</p></section>
<main class="folio-scene"><div class="desk-note">十张收藏 · 十二页心情 <span>↘</span></div><div class="folio-book" id="book"></div><div class="loading" role="status">正在把喜欢贴进纸里…</div></main>
<nav class="reader-controls" aria-label="翻页控制"><button id="prev" aria-label="上一页">←</button><span id="page-count" aria-live="polite">封面 / 12</span><button id="next" aria-label="下一页">→</button><span class="control-divider"></span><button id="flat" class="text-button">平面阅读</button></nav>
<div class="light-controls"><label for="light-angle">光线角度</label><span aria-hidden="true">☀</span><input id="light-angle" type="range" min="-65" max="65" value="22" aria-label="光线角度"><small>移动光线，看看照片与胶带的反光</small></div>
<footer><span>拖动书页边角，或用 ← → 慢慢翻阅</span><span>生日来信 · 线条与陪伴 · 蓝色小心情</span></footer>
<dialog id="index"><div class="dialog-head"><div><small>THE LITTLE COLLECTION</small><h2>喜欢的，都在这里。</h2></div><button id="close" aria-label="关闭目录">×</button></div><div class="chapters"><button data-jump="0">封面</button><button data-jump="1">01 生日来信</button><button data-jump="4">02 线条与陪伴</button><button data-jump="8">03 蓝色小心情</button></div><div class="thumbs">${entries.map((e,i)=>`<button data-jump="${i+1}"><img src="${source(i)}" alt="${e.title}" loading="lazy"><span><small>${String(i+1).padStart(2,'0')}</small>${e.title}</span></button>`).join('')}</div></dialog>`;
const book=document.querySelector<HTMLDivElement>('#book')!, count=document.querySelector('#page-count')!, status=document.querySelector<HTMLElement>('.loading')!, dialog=document.querySelector<HTMLDialogElement>('#index')!, flat=document.querySelector<HTMLButtonElement>('#flat')!;
let surfaceMaps:SurfaceMap[]=[];
const lightAngle=document.querySelector<HTMLInputElement>('#light-angle')!;
lightAngle.addEventListener('input',()=>controller?.setLightAngle?.(Number(lightAngle.value)));
let controller:BookController|undefined, pages:string[]=[],current=0,plain=false,dispose:(()=>void)|undefined;
const previous=document.querySelector<HTMLButtonElement>('#prev')!,next=document.querySelector<HTMLButtonElement>('#next')!;
function update(indices:number[]){current=indices[0]??0;count.textContent=(current===0?'封面':indices.map(i=>String(i+1).padStart(2,'0')).join(' — '))+' / 12';previous.disabled=current===0;next.disabled=indices.includes(11);}
function flatView(){dispose?.();dispose=undefined;controller=undefined;book.replaceChildren();book.classList.add('plain');lightAngle.disabled=true;const im=document.createElement('img');im.src=pages[current];im.alt=current===0?'把喜欢，贴进纸里：剪贴簿封面':entries[current-1]?.title??'收藏的意义：尾声';book.append(im);update([current]);}
function goTo(n:number){n=Math.max(0,Math.min(11,n));if(plain){current=n;flatView();}else controller?.goTo(n);}
function turn(forward:boolean){if(plain)goTo(current+(forward?1:-1));else controller?.turn(forward);}
previous.onclick=()=>turn(false);next.onclick=()=>turn(true);
document.querySelector('#contents')!.addEventListener('click',()=>dialog.showModal());document.querySelector('#close')!.addEventListener('click',()=>dialog.close());dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
dialog.querySelectorAll<HTMLButtonElement>('[data-jump]').forEach(b=>b.onclick=()=>{goTo(Number(b.dataset.jump));dialog.close();});
document.addEventListener('keydown',e=>{if(dialog.open)return;if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();turn(e.key==='ArrowRight');}});
function viewer(){lightAngle.disabled=false;book.classList.remove('plain');book.replaceChildren();dispose=mountViewer(book,{pages,surfaceMaps,lightAngle:Number(lightAngle.value),initialPage:current,patternSource:'./assets/paper.webp',shadow:38,onController:c=>controller=c,onPageChange:update,onReady:()=>status.hidden=true,onError:()=>{queueMicrotask(()=>{plain=true;flat.textContent='翻页模式';flatView();status.hidden=true;});}});}
flat.onclick=()=>{if(!pages.length)return;plain=!plain;flat.textContent=plain?'翻页模式':'平面阅读';if(plain)flatView();else viewer();};
makePages().then(p=>{pages=p.pages;surfaceMaps=p.surfaceMaps;viewer();}).catch(()=>{status.textContent='图片未能加载，请刷新页面重试。';status.setAttribute('role','alert');});
