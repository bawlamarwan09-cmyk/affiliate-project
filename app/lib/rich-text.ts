export type RichTextBlock={type:"heading"|"paragraph"|"list";value:string|string[]};
type RichTextOptions={documentTitle?:string;inferNaturalStructure?:boolean};

function comparable(value:string){return value.toLowerCase().replace(/[’‘]/g,"'").replace(/\s+/g," ").trim()}
function naturalHeading(line:string){
  if(line.length>110)return false;
  if(/^\d+\.\s+\S/.test(line))return true;
  if(line.endsWith("?"))return true;
  return /^(our|final|key|top|best|important|deal|product|price|shipping|buying|shopping|things)\b/i.test(line)||/\b(checklist|buying guide|shopping guide|what to know|what to look for)\b/i.test(line);
}

export function richTextBlocks(text:string,options:RichTextOptions={}){
  const blocks:RichTextBlock[]=[];
  let paragraph:string[]=[];
  let list:string[]=[];
  let listAfterColon=false;
  let firstContentLine=true;
  const flushParagraph=()=>{if(paragraph.length){blocks.push({type:"paragraph",value:paragraph.join("\n")});paragraph=[]}};
  const flushList=()=>{if(list.length){blocks.push({type:"list",value:list});list=[]}};
  for(const sourceLine of text.replace(/\r\n?/g,"\n").split("\n")){
    const line=sourceLine.trimEnd();
    const trimmed=line.trim();
    if(!trimmed){flushParagraph();flushList();continue}
    if(firstContentLine){firstContentLine=false;if(options.documentTitle&&comparable(trimmed)===comparable(options.documentTitle))continue}
    const explicitHeading=trimmed.match(/^#{2,3}\s+(.+)$/);
    const inferredHeading=options.inferNaturalStructure&&naturalHeading(trimmed)?trimmed:null;
    if(explicitHeading||inferredHeading){flushParagraph();flushList();listAfterColon=false;blocks.push({type:"heading",value:explicitHeading?.[1]||inferredHeading||trimmed});continue}
    const listItem=trimmed.match(/^[-*]\s+(.+)$/);
    const inferredListItem=options.inferNaturalStructure&&listAfterColon&&trimmed.length<=120&&!/[.!?]$/.test(trimmed)?trimmed:null;
    if(listItem||inferredListItem){flushParagraph();list.push(listItem?.[1]||inferredListItem||trimmed);continue}
    flushList();
    listAfterColon=false;
    paragraph.push(line);
    if(trimmed.endsWith(":")){flushParagraph();listAfterColon=true}
  }
  flushParagraph();flushList();
  return blocks;
}
