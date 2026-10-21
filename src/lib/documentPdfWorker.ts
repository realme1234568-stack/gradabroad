// Fixed worker source, never built from uploaded text. Parsing runs off the
// request thread with a heap limit and a deadline, including decompression.
export const DOCUMENT_PDF_WORKER = String.raw`
const { parentPort, workerData } = require('node:worker_threads');
const { PDFArray, PDFDict, PDFDocument, PDFName } = require('pdf-lib');
const blockedKeys = new Set(['JS','JavaScript','AA','OpenAction','EmbeddedFiles','EF','AF','XFA','AcroForm','RichMediaContent','RichMediaSettings','Collection']);
const blockedNames = new Set(['JavaScript','Launch','SubmitForm','ImportData','GoToR','GoToE','Rendition','Movie','Sound','RichMedia','RichMediaExecute','FileAttachment']);
(async () => {
  try {
    const pdf = await PDFDocument.load(workerData.bytes, {ignoreEncryption:false,updateMetadata:false,throwOnInvalidObject:true});
    if (pdf.getPageCount() < 1 || pdf.getPageCount() > 200) throw new Error('Page limit');
    const objects = pdf.context.enumerateIndirectObjects();
    if (objects.length > 20000) throw new Error('Object limit');
    let visited = 0;
    function inspect(object,depth=0) {
      if (++visited > 100000 || depth > 50) throw new Error('Complex PDF');
      if (object instanceof PDFDict) for (const [key,value] of object.entries()) {
        if (blockedKeys.has(key.decodeText())) throw new Error('Active PDF');
        inspect(value,depth+1);
      }
      else if (object instanceof PDFArray) for (const value of object.asArray()) inspect(value,depth+1);
      else if (object instanceof PDFName && blockedNames.has(object.decodeText())) throw new Error('Active PDF');
      else if (object && typeof object === 'object' && 'dict' in object) inspect(object.dict,depth+1);
    }
    for (const [,object] of objects) inspect(object);
    parentPort.postMessage(true);
  } catch { parentPort.postMessage(false); }
})();
`;
