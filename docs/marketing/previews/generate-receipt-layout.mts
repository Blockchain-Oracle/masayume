/** Static React fixture: no app/server, wallet, provider or delivery startup. */
import { createRequire } from "node:module";
import { readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { XReceiptsList } from "../../../web/src/features/x/XReceiptsList.tsx";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../../..");
const webRequire = createRequire(join(root, "web/package.json"));
const { createElement } = webRequire("react");
const { renderToStaticMarkup } = webRequire("react-dom/server");
const css = await readFile(join(root, "web/src/features/x/x.css"), "utf8");
const chunks = join(root, "web/.next/static/chunks");
const fontFaces: string[] = [];
for (const name of await readdir(chunks)) {
  if (!name.endsWith(".css")) continue;
  const built = await readFile(join(chunks, name), "utf8");
  for (const face of built.match(/@font-face\s*\{[^}]+\}/g) ?? []) {
    if (!/font-family:JetBrains Mono;/.test(face) || !/font-weight:400;/.test(face)) continue;
    const match = face.match(/url\(([^)]+)\)/);
    if (!match?.[1]) continue;
    const font = await readFile(resolve(chunks, match[1]));
    fontFaces.push(face.replace(match[0], `url(data:font/woff2;base64,${font.toString("base64")})`));
  }
}
if (!fontFaces.length) throw new Error("Build font cache missing: cannot claim the actual JetBrains Mono font was checked.");

const base = {
  authorId: "DEMO", handle: null, wallet: null, grantId: null, marketId: null, side: "up" as const,
  stakeBase: "5000000", reason: null, txHash: `0x${"1".repeat(64)}`, instruction: "@masayume_app BTC up 5 5m", atMs: 0,
};
const receipts = [
  { ...base, mentionId: "tiny-filled", status: "filled", bookedCostBase: "1" },
  { ...base, mentionId: "historical-filled", status: "filled", bookedCostBase: null },
  { ...base, mentionId: "unknown", status: "unknown", instruction: "@masayume_app " + "verylongunbrokeninstruction".repeat(4) },
  { ...base, mentionId: "refused", status: "refused", txHash: null, reason: "Review your trading permission and spending limits before trying again. " + "longunbrokenreason".repeat(4) },
  { ...base, mentionId: "submitted", status: "submitted", stakeBase: "9".repeat(78) },
  { ...base, mentionId: "reverted", status: "reverted" },
  { ...base, mentionId: "no-fill", status: "nothing-filled" },
] satisfies Parameters<typeof XReceiptsList>[0]["receipts"];
const markup = renderToStaticMarkup(createElement(XReceiptsList, { receipts, configured: true, decimals: 6, symbol: "tUSDC" }));
const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>DEMO · X receipt layout check</title><style>
${fontFaces.join("\n")}
*{box-sizing:border-box}html,body{margin:0}body{--font-mono:'JetBrains Mono',ui-monospace,monospace;font-family:var(--font-mono);background:#08080b;color:#f3f1ee}header{max-width:42rem;margin:auto;padding:24px 20px 0;font-size:12px;line-height:1.6}h1{font-size:16px;font-weight:400;color:#e04d26}p{margin:8px 0}#layout-check{color:#34d399}
${css}
</style></head><body><header><h1>DEMO · Receipt layout check</h1><p>Real XReceiptsList + x.css. Synthetic fixtures only. No trades or production data. Links are disabled.</p><p id="layout-check">Checking layout…</p></header><main class="xt-page"><section class="xt-flow-wrap">${markup}</section></main><script>
document.addEventListener('click',event=>{if(event.target.closest('a'))event.preventDefault()});
document.fonts.ready.then(()=>requestAnimationFrame(()=>{
 const rows=[...document.querySelectorAll('.xt-receipt')].map(row=>({width:row.clientWidth,scrollWidth:row.scrollWidth,columns:getComputedStyle(row).gridTemplateColumns,children:[...row.children].map(child=>({className:child.className,width:child.clientWidth,scrollWidth:child.scrollWidth,wrap:getComputedStyle(child).whiteSpace,overflow:getComputedStyle(child).overflow,bounds:{left:child.getBoundingClientRect().left,right:child.getBoundingClientRect().right}}))}));
 const overflow=rows.flatMap(row=>row.children).filter(child=>child.bounds.left<0||child.bounds.right>innerWidth+1||(child.scrollWidth>child.width+1&&child.overflow!=='hidden'));
 const result={viewport:{width:innerWidth,height:innerHeight},fontReady:document.fonts.check('12px "JetBrains Mono"'),pageWidth:document.documentElement.scrollWidth,overflowCount:overflow.length,rows};
 const data=document.createElement('script');data.id='layout-metrics';data.type='application/json';data.textContent=JSON.stringify(result);document.body.append(data);
 document.getElementById('layout-check').textContent=innerWidth+'px · '+(result.pageWidth<=innerWidth&&overflow.length===0?'PASS · no content overflow':'FAIL · inspect overflow');
}));
</script></body></html>`;
await writeFile(join(here, "receipt-layout-fixture.html"), html);
await writeFile(join(here, "receipt-layout-source.json"), JSON.stringify({
  kind: "static component fixture, not a production screenshot",
  component: "web/src/features/x/XReceiptsList.tsx", css: "web/src/features/x/x.css",
  cssSha256: createHash("sha256").update(css).digest("hex"), font: "JetBrains Mono 400 from the local Next build cache",
  cases: receipts.map(r => r.mentionId),
}, null, 2) + "\n");
