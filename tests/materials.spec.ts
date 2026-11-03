import {test,expect,type Page} from '@playwright/test';
import {PNG} from 'pngjs';
import fs from 'node:fs';

async function light(page:Page,value:number){
  await page.locator('#light-angle').evaluate((element,value)=>{
    const input=element as HTMLInputElement;input.value=String(value);
    input.dispatchEvent(new Event('input',{bubbles:true}));
  },value);
  await page.waitForTimeout(400);
}
function difference(a:Buffer,b:Buffer){
  const first=PNG.sync.read(a),second=PNG.sync.read(b);
  expect(first.width).toBe(second.width);expect(first.height).toBe(second.height);
  let changed=0;
  for(let i=0;i<first.data.length;i+=4){
    const d=Math.abs(first.data[i]-second.data[i])+Math.abs(first.data[i+1]-second.data[i+1])+Math.abs(first.data[i+2]-second.data[i+2]);
    if(d>18)changed++;
  }
  return changed;
}
for(const mobile of [false,true]){
 test(`${mobile?'mobile':'desktop'} compiles PBR, reflects moving light, and turns pages`,async({page})=>{
  const errors:string[]=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  if(mobile)await page.setViewportSize({width:390,height:844});
  await page.goto('/');
  const host=page.locator('.book-host');
  await expect(host).toHaveAttribute('data-magazine-state','ready',{timeout:60000});
  await expect(host).toHaveAttribute('data-magazine-all-pages-ready','true',{timeout:60000});
  await expect(page.locator('#book')).not.toHaveClass(/plain/);
  await expect(page.locator('.book-frame')).toHaveClass(/desktop/);
  await light(page,-45);
  const left=await page.locator('.folio-scene').screenshot();
  await light(page,5);
  const front=await page.locator('.folio-scene').screenshot();
  // This captures the WebGL canvas: color pages are unchanged while light moves.
  expect(difference(left,front)).toBeGreaterThan(1500);
  fs.mkdirSync('artifacts/materials',{recursive:true});
  fs.writeFileSync(`artifacts/materials/${mobile?'mobile':'desktop'}-left.png`,left);
  fs.writeFileSync(`artifacts/materials/${mobile?'mobile':'desktop'}-front.png`,front);
  await page.locator('#next').click();
  await expect(host).toHaveAttribute('data-magazine-visible-pages','2,3',{timeout:15000});
  await page.waitForTimeout(1400);
  await light(page,-15);
  await page.locator('.folio-scene').screenshot({path:`artifacts/materials/${mobile?'mobile':'desktop'}-turned.png`});
  expect(errors).toEqual([]);
 });
}
