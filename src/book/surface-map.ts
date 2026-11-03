/** Linear data, not an illustration: RG = tangent-space normal XY,
 * B = perceptual roughness, A = coating (paper 0 / photo .5 / tape 1).
 * A single 512px map per page keeps the GPU cost small on phones. */
export interface SurfaceMap { width: number; height: number; data: Uint8Array<ArrayBuffer>; }
export interface SurfacePatch {
  x: number; y: number; width: number; height: number; angle: number;
}
export function photoSurface(x:number,y:number,w:number,h:number,angle:number):SurfacePatch {
  return {x:x+w/2,y:y+h/2,width:w,height:h,angle};
}
const clamp = (x:number,a:number,b:number) => Math.max(a,Math.min(b,x));
const noise = (x:number,y:number) => {
  const v=Math.sin(x*127.1+y*311.7)*43758.5453;return v-Math.floor(v);
};
// Height in original page pixels. Narrow, curved ridges describe compressed
// plastic; several different directions and lengths avoid a repeated wave pattern.
function tapeHeight(u:number,v:number,seed:number):number {
  let height=.16*Math.sin(u*.055+v*.037+seed);
  const centers=[-54,-17,24,59],widths=[3.8,2.5,4.5,3.1];
  for(let i=0;i<centers.length;i++){
    const direction=i%2?-.24:.18;
    const bend=Math.sin(v*.065+seed+i*1.7)*2.8;
    const center=centers[i]+Math.sin(seed+i)*4+v*direction+bend;
    const d=(u-center)/widths[i];
    const length=Math.exp(-Math.pow((v-(i%2?9:-10))/34,2));
    height+=(i%2?.82:1.1)*Math.exp(-d*d)*length;
    // A smaller compression valley beside the ridge makes its two sides catch
    // different parts of the light source as the light angle changes.
    const valley=(u-center-widths[i]*1.8)/(widths[i]*1.4);
    height-=.22*Math.exp(-valley*valley)*length;
  }
  const bubbleX=(u-37)/18,bubbleY=(v+8)/14;
  height+=.5*Math.exp(-bubbleX*bubbleX-bubbleY*bubbleY);
  // End sections are less tightly pressed than the middle of the tape.
  height+=.55*Math.exp(-Math.pow((u+80)/6,2));
  height+=.42*Math.exp(-Math.pow((u-77)/7,2));
  return height;
}
export function makeSurfaceMap(patches:SurfacePatch[], width=512):SurfaceMap {
  const height=Math.round(width*1.377), data=new Uint8Array(width*height*4);
  // Inverse transforms exactly match the original Canvas photo and tape placement.
  const transforms=patches.map(p=>({...p,cos:Math.cos(p.angle),sin:Math.sin(p.angle),seed:noise(p.x,p.y)*Math.PI*2}));
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const px=(x+.5)/width*1000,py=(y+.5)/height*1377;
    const grain=noise(x,y)-.5;
    let nx=grain*.045,ny=(noise(x+73,y)-.5)*.045,roughness=.91+grain*.06,coating=0;
    for(const p of transforms){
      const dx=px-p.x,dy=py-p.y;
      const u=dx*p.cos+dy*p.sin,v=-dx*p.sin+dy*p.cos;
      if(u>=-p.width/2-15&&u<=p.width/2+15&&v>=-p.height/2-15&&v<=p.height/2+67){
        const s=(u+p.width/2+15)/(p.width+30),t=(v+p.height/2+15)/(p.height+82);
        // A very gentle real normal variation bends the reflected light only.
        let localX=.055*Math.sin(s*Math.PI*2)+grain*.004;
        let localY=.018*Math.sin(t*Math.PI*2);
        const edge=Math.min(s,1-s,t,1-t);
        const rim=clamp((.012-edge)/.012,0,1);
        localX+=Math.sign(s-.5)*rim*.13;
        localY+=Math.sign(t-.5)*rim*.13;
        nx=localX*p.cos-localY*p.sin;ny=localX*p.sin+localY*p.cos;
        roughness=.24+grain*.012;coating=.5;
      }
      // Original tape is nested inside the photo's rotation, with a slight turn.
      const tapeV=v+p.height/2+12,ta=-p.angle*.4;
      const tu=u*Math.cos(ta)+tapeV*Math.sin(ta);
      const tv=-u*Math.sin(ta)+tapeV*Math.cos(ta);
      // Test the same quadrilateral as the untouched tape artwork.
      const top=-23-(tu+85)*3/167,bottom=26-(tu+80)*4/157;
      if(tu>=-85+clamp((tv+23)/49,0,1)*5&&tu<=82-clamp((tv+26)/48,0,1)*5&&tv>=top&&tv<=bottom){
        const theta=p.angle+ta;
        const step=.75;
        // Central differences of the actual wrinkle height field produce its
        // tangent-space normals. The crease highlights are never color strokes.
        const localX=-(tapeHeight(tu+step,tv,p.seed)-tapeHeight(tu-step,tv,p.seed))/(2*step);
        const localY=-(tapeHeight(tu,tv+step,p.seed)-tapeHeight(tu,tv-step,p.seed))/(2*step);
        nx=localX*Math.cos(theta)-localY*Math.sin(theta);
        ny=localX*Math.sin(theta)+localY*Math.cos(theta);
        // Smooth stretched film, with slightly hazier patches from handling.
        const handling=.5+.5*Math.sin(tu*.045+Math.sin(tv*.12)+p.seed);
        roughness=.13+handling*.065+grain*.012;coating=1;
      }
    }
    // Store bottom row first for a linear DataTexture (no DOM image flip).
    const offset=((height-1-y)*width+x)*4;
    const length=Math.sqrt(1+nx*nx+ny*ny);
    data[offset]=Math.round((nx/length*.5+.5)*255);
    // Canvas Y points down; tangent-space UV Y points up.
    data[offset+1]=Math.round((-ny/length*.5+.5)*255);
    data[offset+2]=Math.round(clamp(roughness,0,1)*255);
    data[offset+3]=Math.round(coating*255);
  }
  return {width,height,data};
}
