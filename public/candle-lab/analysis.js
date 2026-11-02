'use strict';
// TradingView OHLC CSV -> native candle colours. All calendar grouping is Asia/Bangkok.
const CandleAnalysis = (() => {
  const local = new Intl.DateTimeFormat('en-CA', {timeZone:'Asia/Bangkok',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
  function clock(t) {
    const p = Object.fromEntries(local.formatToParts(new Date(t*1000)).map(p=>[p.type,p.value]));
    return {date:`${p.year}-${p.month}-${p.day}`,minute:Number(p.hour)*60+Number(p.minute)};
  }
  function parseCSV(text) {
    text=text.replace(/^\uFEFF/,'');
    const first=text.split(/\r?\n/,1)[0];
    const delimiter=(first.match(/;/g)||[]).length>(first.match(/,/g)||[]).length?';':',';
    const rows=[]; let row=[],cell='',quoted=false;
    for(let i=0;i<text.length;i++) {
      const c=text[i];
      if(c==='"') {if(quoted&&text[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}
      else if(c===delimiter&&!quoted){row.push(cell);cell='';}
      else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell);if(row.some(x=>x.trim()))rows.push(row);row=[];cell='';}
      else cell+=c;
    }
    if(quoted)throw new Error('CSV มีเครื่องหมายคำพูดไม่ครบ');
    if(cell.length||row.length){row.push(cell);if(row.some(x=>x.trim()))rows.push(row);}
    return rows;
  }
  function timestamp(s) {
    s=String(s||'').trim();
    if(/^\d+(\.\d+)?$/.test(s)){const n=Number(s);return n>1e12?n/1000:n;}
    if(!/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/.test(s))return NaN;
    // Naive calendar strings explicitly use Thai time; never use the viewer's computer timezone.
    if(!/(Z|[+-]\d{2}:?\d{2})$/i.test(s))s=s.replace(' ','T')+'+07:00';
    return Date.parse(s)/1000;
  }
  function identity(name) {
    const stem=name.replace(/\.csv$/i,'').split(',')[0].trim().replace(/[_ -](?:H[124]|[124]H)$/i,'');
    const match=stem.match(/^([A-Za-z0-9_]+)_(.+)$/);
    return match?{id:match[1]+':'+match[2],symbol:match[2],exchange:match[1]}:{id:stem,symbol:stem,exchange:''};
  }
  function ingest(text,name) {
    const csv=parseCSV(text);if(csv.length<2)throw new Error('ไฟล์ไม่มีข้อมูลแท่งเทียน');
    const header=csv.shift().map(s=>s.trim().toLowerCase());
    const ix=['time','open','high','low','close'].map(k=>header.indexOf(k));
    if(ix.some(i=>i<0))throw new Error('CSV ต้องมีคอลัมน์ time, open, high, low, close');
    const candles=[],seen=new Map();let duplicates=0;
    for(let i=0;i<csv.length;i++){
      const r=csv[i],vals=ix.slice(1).map(j=>r[j]?.trim()===''?NaN:Number(r[j]));
      const t=timestamp(r[ix[0]]);const [o,h,l,c]=vals;
      if(!Number.isFinite(t)||!vals.every(Number.isFinite)||t<=0||l>Math.min(o,c)||h<Math.max(o,c)||h<l)
        throw new Error(`ข้อมูลเวลา/OHLC ไม่ถูกต้องที่แถว ${i+2}`);
      const candle=[t,o,h,l,c];
      if(seen.has(t)){if(JSON.stringify(seen.get(t))!==JSON.stringify(candle))throw new Error(`เวลาแท่งซ้ำแต่ OHLC ต่างกันที่แถว ${i+2}`);duplicates++;continue;}
      seen.set(t,candle);candles.push(candle);
    }
    candles.sort((a,b)=>a[0]-b[0]);
    const diffs=candles.slice(1).map((x,i)=>x[0]-candles[i][0]).filter(x=>x>0).sort((a,b)=>a-b);
    if(!diffs.length)throw new Error('ต้องมีอย่างน้อย 2 แท่งเพื่อยืนยัน TF');
    const typical=diffs[Math.floor(diffs.length/2)];
    const minutes=typical/60;
    if(![60,120,240].includes(minutes))throw new Error(`ตรวจพบช่วงแท่ง ${minutes} นาที รองรับไฟล์ 60, 120 หรือ 240 นาที`);
    const declared=name.match(/,\s*(60|120|240)(?:[_ .]|$)/);
    if(declared&&Number(declared[1])!==minutes)throw new Error('TF ในชื่อไฟล์ไม่ตรงกับช่วงเวลาของข้อมูล');
    return {...identity(name),name,minutes,candles,duplicates,inputRows:csv.length};
  }
  const colour=r=>r[4]>r[1]?1:r[4]<r[1]?-1:0;
  function nativeRows(file,excludeLast) {
    const rows=excludeLast?file.candles.slice(0,-1):file.candles;
    return rows.map(r=>({...clock(r[0]),colour:colour(r),time:r[0]}));
  }
  function aggregateH1(file,minutes,excludeLast) {
    const rows=excludeLast?file.candles.slice(0,-1):file.candles;
    const byTime=new Map(rows.map(r=>[r[0],r])),out=[];
    for(const r of rows){
      const t=clock(r[0]);
      if((t.minute-60+1440)%minutes!==0)continue;
      const members=Array.from({length:minutes/60},(_,i)=>byTime.get(r[0]+i*3600));
      if(members.some(r=>!r))continue;
      out.push({...t,time:r[0],colour:members.at(-1)[4]>r[1]?1:members.at(-1)[4]<r[1]?-1:0});
    }
    return out;
  }
  function materialize(asset,mode,excludeLast=true) {
    const minutes=mode==='H4'?240:120;
    if(asset.files?.[minutes])return {rows:nativeRows(asset.files[minutes],excludeLast),method:`${mode} จากแท่ง ${minutes} นาทีใน CSV`,file:asset.files[minutes]};
    if(asset.files?.[60])return {rows:aggregateH1(asset.files[60],minutes,excludeLast),method:`${mode} รวมจาก 1H ครบ ${minutes/60} แท่ง ยึดเวลา 01:00 ไทย`,file:asset.files[60]};
    if(asset.legacy?.[mode])return {rows:asset.legacy[mode],method:mode==='H4'?'H4 จากตาราง NQ1! เดิม':'H2 จากข้อมูล 1H ในตาราง NQ1! เดิม',file:null};
    return {rows:[],method:'ต้องเพิ่ม CSV 120 หรือ 60 นาทีสำหรับ H2',file:null};
  }
  function dayMap(rows){const out=new Map();for(const r of rows){if(!out.has(r.date))out.set(r.date,new Map());out.get(r.date).set(r.minute,r.colour);}return out;}
  function stats(map,a,b,year='all',month=null){
    let n=0,k=0,green=0,gg=0,red=0,rr=0;
    for(const [date,v] of map){if(year!=='all'&&!date.startsWith(String(year)))continue;if(month&&Number(date.slice(5,7))!==Number(month))continue;
      const x=v.get(a),y=v.get(b);if(!x||!y)continue;n++;if(x===y)k++;if(x===1){green++;if(y===1)gg++;}else{red++;if(y===-1)rr++;}}
    return {n,k,green,gg,red,rr,rate:n?100*k/n:null};
  }
  return {clock,parseCSV,identity,ingest,nativeRows,aggregateH1,materialize,dayMap,stats};
})();
if(typeof module!=='undefined')module.exports=CandleAnalysis;

