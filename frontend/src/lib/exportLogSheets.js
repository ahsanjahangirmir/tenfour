import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const PAGE_GAP_PX = 24;

async function renderCanvases(nodes) {
  const canvases = [];
  for (const node of nodes) {
    if (!node) continue;
    canvases.push(await html2canvas(node, { scale: 2, backgroundColor: "#ffffff" }));
  }
  return canvases;
}

function downloadCombinedPng(canvases, filename) {
  const width = Math.max(...canvases.map((c) => c.width));
  const totalHeight =
    canvases.reduce((sum, c) => sum + c.height, 0) + PAGE_GAP_PX * (canvases.length - 1);

  const combined = document.createElement("canvas");
  combined.width = width;
  combined.height = totalHeight;
  const ctx = combined.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, totalHeight);

  let y = 0;
  for (const canvas of canvases) {
    ctx.drawImage(canvas, 0, y);
    y += canvas.height + PAGE_GAP_PX;
  }

  const link = document.createElement("a");
  link.download = `${filename}.png`;
  link.href = combined.toDataURL("image/png");
  link.click();
}

function downloadCombinedPdf(canvases, filename) {
  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "px",
    format: [canvases[0].width, canvases[0].height],
  });

  canvases.forEach((canvas, i) => {
    if (i > 0) pdf.addPage([canvas.width, canvas.height], "landscape");
    pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, canvas.width, canvas.height);
  });

  pdf.save(`${filename}.pdf`);
}

/** Renders every given log-sheet DOM node once, then exports all of them
 * together as a single stacked PNG or a single multi-page PDF — one export
 * instead of one per day. */
export async function exportAllPng(nodes, filename) {
  const canvases = await renderCanvases(nodes);
  if (canvases.length > 0) downloadCombinedPng(canvases, filename);
}

export async function exportAllPdf(nodes, filename) {
  const canvases = await renderCanvases(nodes);
  if (canvases.length > 0) downloadCombinedPdf(canvases, filename);
}
