import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useState } from "react";

export default function ExportButtons({ targetRef, filename }) {
  const [exporting, setExporting] = useState(false);

  async function renderCanvas() {
    return html2canvas(targetRef.current, { scale: 2, backgroundColor: "#ffffff" });
  }

  async function exportPng() {
    setExporting(true);
    try {
      const canvas = await renderCanvas();
      const link = document.createElement("a");
      link.download = `${filename}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } finally {
      setExporting(false);
    }
  }

  async function exportPdf() {
    setExporting(true);
    try {
      const canvas = await renderCanvas();
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "px",
        format: [canvas.width, canvas.height],
      });
      pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
      pdf.save(`${filename}.pdf`);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="export-buttons">
      <button type="button" className="button button--ghost" onClick={exportPng} disabled={exporting}>
        Export PNG
      </button>
      <button type="button" className="button button--ghost" onClick={exportPdf} disabled={exporting}>
        Export PDF
      </button>
    </div>
  );
}
