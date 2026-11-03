import { makeSurfaceMap, photoSurface, type SurfaceMap, type SurfacePatch } from './book/surface-map';

export const entries = [
  { file:'3706937', title:'先许一个愿', chapter:'01 / 生日来信', note:'把烛光和笑意，一起留在这一页。', color:'#91a7bf', tag:'MAKE A WISH' },
  { file:'3710065', title:'给你一块甜', chapter:'01 / 生日来信', note:'有些祝福，藏在一小块蛋糕里。', color:'#d4a2a0', tag:'A LITTLE SWEETNESS' },
  { file:'3712363', title:'把晴天展开', chapter:'01 / 生日来信', note:'愿下一阵风，带来刚刚好的晴朗。', color:'#719c8b', tag:'SKY FULL OF WISHES' },
  { file:'3713984', title:'线条里的你', chapter:'02 / 线条与陪伴', note:'寥寥几笔，也能把目光留住。', color:'#969d94', tag:'PENCIL NOTES / 01' },
  { file:'3717359', title:'安静的一格', chapter:'02 / 线条与陪伴', note:'留一点空白，给还没说出口的话。', color:'#b3a08a', tag:'PENCIL NOTES / 02' },
  { file:'3715439', title:'靠近一点点', chapter:'02 / 线条与陪伴', note:'一张合照，让纸上的距离也变近。', color:'#a5a58a', tag:'SIDE BY SIDE' },
  { file:'3726766', title:'日常小剧场', chapter:'02 / 线条与陪伴', note:'连小小的拌嘴，都值得贴进收藏。', color:'#c49d7e', tag:'ORDINARY, LOVELY DAYS' },
  { file:'3719063', title:'叮！碰个头', chapter:'03 / 蓝色小心情', note:'严肃暂停。现在是可爱时间。', color:'#ada0b6', tag:'A TINY INTERLUDE' },
  { file:'3728441', title:'蓝色的温柔', chapter:'03 / 蓝色小心情', note:'把音量调小，把温柔放大。', color:'#9bbcd3', tag:'SOFT BLUE / 01' },
  { file:'3730041', title:'把快乐打个包', chapter:'03 / 蓝色小心情', note:'最后一页的笑容，送给翻到这里的你。', color:'#849fc7', tag:'SOFT BLUE / 02' },
];
export const source = (i:number) => `./keepsakes/mmexport179370${entries[i].file}.jpg`;
export async function makePages():Promise<{pages:string[];surfaceMaps:SurfaceMap[]}> {
 const images = await Promise.all(entries.map((_,i)=>new Promise<HTMLImageElement>((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(Error('图片读取失败'));im.src=source(i);}))); 
 const pages:string[]=[],surfaceMaps:SurfaceMap[]=[];
 let patches:SurfacePatch[]=[];
 function capture(canvas:HTMLCanvasElement){pages.push(canvas.toDataURL('image/jpeg',.9));surfaceMaps.push(makeSurfaceMap(patches));}
 function base(n:number,chapter:string){
 patches=[];
 const canvas=document.createElement('canvas');canvas.width=1000;canvas.height=1377;
 const c=canvas.getContext('2d')!;c.fillStyle='#f8f4e9';c.fillRect(0,0,1000,1377);
 // Reproducible, delicate paper fibres; no network fonts or generated artwork.
 let seed=71+n;for(let i=0;i<11000;i++){seed=(seed*16807)%2147483647;const x=seed%1000;seed=(seed*16807)%2147483647;const y=seed%1377;c.fillStyle=i%2?'#bcb49d14':'#ffffff65';c.fillRect(x,y,1,1);}
 c.strokeStyle='#c3bcaa65';c.lineWidth=1;c.strokeRect(34,34,932,1309);
 c.fillStyle='#797b70';c.font='17px sans-serif';c.fillText('PAPER KEEPSAKES',64,83);c.textAlign='right';c.fillText(chapter,936,83);c.textAlign='left';
 c.beginPath();c.moveTo(64,105);c.lineTo(936,105);c.stroke();c.font='18px monospace';c.fillText(String(n).padStart(2,'0'),64,1303);c.textAlign='right';c.fillText('把喜欢，贴进纸里',936,1303);c.textAlign='left';return {canvas,c};
 }
 function text(c:CanvasRenderingContext2D,t:string,x:number,y:number,size:number,color='#414b48'){c.fillStyle=color;c.font=`${size}px "Noto Serif CJK SC", "Songti SC", serif`;c.fillText(t,x,y);}
 function tape(c:CanvasRenderingContext2D,x:number,y:number,color:string,angle:number){c.save();c.translate(x,y);c.rotate(angle);c.globalAlpha=.68;c.fillStyle=color;c.beginPath();c.moveTo(-85,-23);c.lineTo(82,-26);c.lineTo(77,22);c.lineTo(-80,26);c.closePath();c.fill();c.globalAlpha=.2;c.strokeStyle='#fff';for(let z=-70;z<80;z+=12){c.beginPath();c.moveTo(z,-22);c.lineTo(z+22,22);c.stroke();}c.restore();}
 function photo(c:CanvasRenderingContext2D,im:HTMLImageElement,x:number,y:number,w:number,h:number,angle:number,caption:string,color:string){patches.push(photoSurface(x,y,w,h,angle));c.save();c.translate(x+w/2,y+h/2);c.rotate(angle);c.shadowColor='#4a403633';c.shadowBlur=18;c.shadowOffsetY=9;c.fillStyle='#fffefa';c.fillRect(-w/2-15,-h/2-15,w+30,h+82);c.shadowColor='transparent';c.fillStyle='#fff';c.fillRect(-w/2,-h/2,w,h);const scale=Math.min(w/im.width,h/im.height);const iw=im.width*scale,ih=im.height*scale;c.drawImage(im,-iw/2,-ih/2,iw,ih);c.fillStyle='#7a7b70';c.font='17px monospace';c.fillText(caption,-w/2+10,h/2+40);tape(c,0,-h/2-12,color,-angle*.4);c.restore();}
 {const {canvas,c}=base(0,'收藏剪贴簿 / VOL. 01');text(c,'把喜欢，',83,233,76);text(c,'贴进纸里。',83,326,76);text(c,'十张画，三段小心情。',88,385,25,'#78867d');photo(c,images[0],125,478,530,540,-.07,'01 — a wish to keep','#a9bcc6');photo(c,images[8],630,695,215,230,.12,'soft blue','#b5cadd');c.save();c.translate(640,1110);c.rotate(-.07);c.fillStyle='#e8ddbd';c.fillRect(0,0,255,65);text(c,'给每一份小小的喜欢',18,41,20);c.restore();text(c,'A SCRAPBOOK OF LITTLE JOYS',88,1215,21,'#78867d');capture(canvas);}
 entries.forEach((e,i)=>{const {canvas,c}=base(i+1,e.chapter);text(c,e.title,75,213,58);text(c,e.tag,78,258,18,'#879084');const landscape=images[i].width/images[i].height>1.25;
 if(landscape){c.fillStyle=e.color+'30';c.fillRect(70,355,860,620);photo(c,images[i],100,410,800,520,i%2?.028:-.025,e.tag,e.color);text(c,'↳ 夹在日记里的一幕',100,1080,24,'#7c8478');}
 else{c.strokeStyle=e.color+'55';for(let y=370;y<1160;y+=34){c.beginPath();c.moveTo(78,y);c.lineTo(925,y);c.stroke();}photo(c,images[i],155,330,690,785,i%2?.035:-.035,e.tag,e.color);}
 c.fillStyle=e.color+'30';c.fillRect(72,1190,856,61);text(c,e.note,94,1230,26);capture(canvas);});
 {const {canvas,c}=base(11,'尾声 / TO BE CONTINUED');text(c,'收藏的意义，',94,280,58);text(c,'是让喜欢有处可去。',94,369,58);photo(c,images[9],285,480,425,425,.06,'KEEP THE LITTLE JOYS','#a9bed8');text(c,'合上这一页，',110,1090,29);text(c,'也把今天的快乐带走。',110,1140,29);capture(canvas);}
 return {pages,surfaceMaps};
}
