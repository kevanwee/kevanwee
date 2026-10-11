// Grey marks for the Experience timeline (components/ExperienceTimeline.tsx), from the existing logos in public/logos.
// Each logo is drawn in Chromium (so SVGs work too), cropped to its emblem where it has one, separated from its
// background colour, trimmed and written as a transparent grey PNG to public/logos/timeline/<name>.png.
// Usage: PLAYWRIGHT_MODULE=<path to playwright> node scripts/build-timeline-logos.mjs
import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {join,extname,basename} from 'node:path';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const SOURCE='public/logos',OUT=join(SOURCE,'timeline');
// Crop boxes as fractions of the image [left, top, right, bottom]: the emblem, leaving out a wordmark beside it.
// 'dark' keeps dark pixels instead of separating the mark from a flat background colour.
const LOGOS={
 'smu.jpg':[0,0,.355,1],                               // the lion-and-flame emblem
 'shopee.svg':[0,0,.3,1],                           // the shopping bag
 'osborneclarke.png':[0,0,.43,1],                    // the circle and half circle
 'pwc.jpg':[0,0,1,1,'dark'],                         // a wordmark on a soft gradient: keep the dark letters
 'imda.png':[0,0,.44,1],                             // the IM block
 'state-courts.png':[0,0,.295,.85],                  // the two pillars and swoosh
 'rajah_tann_technologies_logo.jpg':[0,0,1,1],       // a wordmark
 'titoisaac.jpg':[0,0,1,1],                          // the boxed TITO
 'dis.jpg':[0,0,.44,1],                              // the globe
};
const browser=await chromium.launch();
try{
 const page=await browser.newPage();
 await mkdir(OUT,{recursive:true});
 for(const [file,crop] of Object.entries(LOGOS)){
  const bytes=await readFile(join(SOURCE,file));
  const type=extname(file)==='.svg'?'image/svg+xml':extname(file)==='.png'?'image/png':'image/jpeg';
  const png=await page.evaluate(async({data,type,crop})=>{
   const img=new Image();img.src=`data:${type};base64,${data}`;await img.decode();
   // SVGs are scaled up so their emblem has enough pixels.
   const scale=type==='image/svg+xml'?3:1,w=Math.round(img.naturalWidth*scale),h=Math.round(img.naturalHeight*scale);
   const canvas=new OffscreenCanvas(w,h),ctx=canvas.getContext('2d');ctx.drawImage(img,0,0,w,h);
   const x0=Math.round(crop[0]*w),y0=Math.round(crop[1]*h),cw=Math.round((crop[2]-crop[0])*w),ch=Math.round((crop[3]-crop[1])*h);
   const pixels=ctx.getImageData(x0,y0,cw,ch),d=pixels.data;
   // The background is the most common opaque corner colour; transparent pixels are background too.
   const corners=[0,(cw-1)*4,(ch-1)*cw*4,((ch-1)*cw+cw-1)*4].map(i=>[d[i],d[i+1],d[i+2],d[i+3]]);
   const bg=corners.find(c=>c[3]>200)||[255,255,255,0];
   const mask=new Float32Array(cw*ch);let minX=cw,minY=ch,maxX=-1,maxY=-1;
   for(let i=0;i<cw*ch;i++){
    const a=d[i*4+3]/255,dist=Math.hypot(d[i*4]-bg[0],d[i*4+1]-bg[1],d[i*4+2]-bg[2])/441;
    const dark=1-(.299*d[i*4]+.587*d[i*4+1]+.114*d[i*4+2])/255;
    const m=crop[4]==='dark'?Math.min(1,Math.max(0,(dark-.45)/.25))*a:bg[3]>200?Math.min(1,Math.max(0,(dist-.05)/.2))*a:a;
    mask[i]=m;if(m>.25){const x=i%cw,y=(i/cw)|0;minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);}
   }
   const tw=maxX-minX+1,th=maxY-minY+1,out=new OffscreenCanvas(tw,th),octx=out.getContext('2d'),img2=octx.createImageData(tw,th);
   for(let y=0;y<th;y++)for(let x=0;x<tw;x++){const o=(y*tw+x)*4,m=mask[(y+minY)*cw+x+minX];img2.data[o]=img2.data[o+1]=img2.data[o+2]=68;img2.data[o+3]=Math.round(m*255);}
   octx.putImageData(img2,0,0);
   // Stored at 48px tall: sharp at the 20-24px display size on high-density screens.
   const target=48,fw=Math.max(1,Math.round(tw*target/th)),final=new OffscreenCanvas(fw,target);
   const fctx=final.getContext('2d');fctx.imageSmoothingQuality='high';fctx.drawImage(out,0,0,fw,target);
   const blob=await final.convertToBlob({type:'image/png'});
   return btoa(String.fromCharCode(...new Uint8Array(await blob.arrayBuffer())));
  },{data:bytes.toString('base64'),type,crop});
  const name=basename(file,extname(file))+'.png';
  await writeFile(join(OUT,name),Buffer.from(png,'base64'));
  console.log('wrote',join(OUT,name));
 }
}finally{await browser.close();}
