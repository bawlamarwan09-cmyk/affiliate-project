export type RichTextBlock=
  |{type:"heading";value:string}
  |{type:"paragraph";value:string}
  |{type:"list";value:string[];ordered:boolean;lettered?:boolean}
  |{type:"table";headers:string[];rows:string[][]};

type RichTextOptions={documentTitle?:string;inferNaturalStructure?:boolean};

function comparable(value:string){return value.toLowerCase().replace(/[’‘]/g,"'").replace(/\s+/g," ").trim()}
function naturalHeading(line:string){
  if(line.length>110)return false;
  if(/^\d+\.\s+\S/.test(line))return true;
  if(line.endsWith("?"))return true;
  return /^(our|final|key|top|best|important|deal|product|price|shipping|buying|shopping|things)\b/i.test(line)||/\b(checklist|buying guide|shopping guide|what to know|what to look for)\b/i.test(line);
}
function tableCells(line:string){return line.trim().replace(/^\||\|$/g,"").split("|").map(cell=>cell.trim())}
function isTableDivider(line:string){const cells=tableCells(line);return cells.length>0&&cells.every(cell=>/^:?-{3,}:?$/.test(cell))}
function marker(line:string){
  const unordered=line.match(/^[-*+]\s+(.+)$/);if(unordered)return {value:unordered[1],ordered:false,lettered:false};
  const numbered=line.match(/^\d+[.)]\s+(.+)$/);if(numbered)return {value:numbered[1],ordered:true,lettered:false};
  const lettered=line.match(/^[a-zA-Z][.)]\s+(.+)$/);if(lettered)return {value:lettered[1],ordered:true,lettered:true};
  return null;
}

export function richTextBlocks(text:string,options:RichTextOptions={}){
  const blocks:RichTextBlock[]=[];
  const lines=text.replace(/\r\n?/g,"\n").split("\n");
  let paragraph:string[]=[];let listAfterColon=false;let firstContentLine=true;
  const flushParagraph=()=>{if(paragraph.length){blocks.push({type:"paragraph",value:paragraph.join("\n")});paragraph=[]}};
  for(let index=0;index<lines.length;index+=1){
    const line=lines[index].trimEnd();const trimmed=line.trim();
    if(!trimmed){flushParagraph();continue}
    if(firstContentLine){firstContentLine=false;if(options.documentTitle&&comparable(trimmed)===comparable(options.documentTitle))continue}
    if(index+1<lines.length&&trimmed.includes("|")&&isTableDivider(lines[index+1])){
      flushParagraph();const headers=tableCells(trimmed);const rows:string[][]=[];index+=2;
      while(index<lines.length&&lines[index].trim().includes("|")){rows.push(tableCells(lines[index]));index+=1}
      index-=1;blocks.push({type:"table",headers,rows});listAfterColon=false;continue;
    }
    const explicitHeading=trimmed.match(/^#{2,4}\s+(.+)$/);const currentMarker=marker(trimmed);const nextMarker=index+1<lines.length?marker(lines[index+1].trim()):null;
    const isConsecutiveList=Boolean(currentMarker&&nextMarker&&currentMarker.ordered===nextMarker.ordered&&currentMarker.lettered===nextMarker.lettered);
    const inferredHeading=options.inferNaturalStructure&&!isConsecutiveList&&naturalHeading(trimmed)?trimmed:null;
    if(explicitHeading||inferredHeading){flushParagraph();listAfterColon=false;blocks.push({type:"heading",value:explicitHeading?.[1]||inferredHeading||trimmed});continue}
    if(currentMarker){
      flushParagraph();const items=[currentMarker.value];
      while(index+1<lines.length){const next=marker(lines[index+1].trim());if(!next||next.ordered!==currentMarker.ordered||next.lettered!==currentMarker.lettered)break;items.push(next.value);index+=1}
      blocks.push({type:"list",value:items,ordered:currentMarker.ordered,lettered:currentMarker.lettered});listAfterColon=false;continue;
    }
    const inferredListItem=options.inferNaturalStructure&&listAfterColon&&trimmed.length<=120&&!/[.!?]$/.test(trimmed)?trimmed:null;
    if(inferredListItem){flushParagraph();const items=[inferredListItem];while(index+1<lines.length){const next=lines[index+1].trim();if(!next||next.length>120||/[.!?]$/.test(next)||marker(next))break;items.push(next);index+=1}blocks.push({type:"list",value:items,ordered:false});listAfterColon=false;continue}
    listAfterColon=false;paragraph.push(line);if(trimmed.endsWith(":")){flushParagraph();listAfterColon=true}
  }
  flushParagraph();return blocks;
}
