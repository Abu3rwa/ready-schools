export const buildPrintHtml = ({
  schoolName,
  logoSrc,
  title,
  meta, // { studentName, teacherName, className, periodLabel }
  headers,
  rowsHtml,
}) => {
  return `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>${schoolName} — ${title}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 16px; }
        .header { text-align: center; margin-bottom: 12px; }
        .header img { height: 128px; display: block; margin: 0 auto 8px; }
        .school-name { font-size: 20px; font-weight: 700; margin: 0 0 4px; }
        .report-title { font-size: 18px; font-weight: 600; margin: 0; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; }
        th { background: #f5f5f5; text-align: left; }
        .meta { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px 24px; margin: 8px 0 16px; }
        .meta div { color: #444; }
        .meta strong { color: #111; }
        @media print { body { margin: 12mm; } }
      </style>
    </head>
    <body>
      <div class="header">
        <img src="${logoSrc}" alt="${schoolName} Logo" />
        <div class="school-name">${schoolName}</div>
        <div class="report-title">${title}</div>
      </div>
      <div class="meta">
        <div><strong>Student:</strong> ${meta.studentName}</div>
        <div><strong>Teacher:</strong> ${meta.teacherName}</div>
        <div><strong>Class:</strong> ${meta.className}</div>
        <div><strong>Period:</strong> ${meta.periodLabel}</div>
      </div>
      <table>
        <thead>
          <tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    </body>
  </html>`;
};

export const printHtml = (html) => {
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.setAttribute("aria-hidden", "true");
  document.body.appendChild(iframe);
  const cleanup = () =>
    setTimeout(() => document.body.removeChild(iframe), 1000);
  iframe.onload = () => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } finally {
      cleanup();
    }
  };
  if ("srcdoc" in iframe) {
    iframe.srcdoc = html;
  } else {
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    doc.open();
    doc.write(html);
    doc.close();
  }
};
