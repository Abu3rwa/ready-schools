import sanitizeHtml from "sanitize-html";
import dayjs from "dayjs";

export const buildEmailTemplate = (data) => {
  const sanitizedContent = sanitizeHtml(data.content, {
    allowedTags: [
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "p",
      "br",
      "ul",
      "ol",
      "li",
      "strong",
      "em",
      "table",
      "thead",
      "tbody",
      "tr",
      "th",
      "td",
    ],
    allowedAttributes: {
      table: ["style"],
      th: ["style"],
      td: ["style"],
    },
  });

  return {
    subject: `${data.schoolName} - ${data.reportType} Report for ${data.studentName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { 
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .logo {
              max-width: 200px;
              height: auto;
            }
            .report-meta {
              background: #f5f5f5;
              padding: 15px;
              border-radius: 5px;
              margin: 20px 0;
            }
            .report-content {
              margin: 20px 0;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 15px 0;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            th {
              background-color: #f5f5f5;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              font-size: 0.9em;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <img src="${data.schoolLogo}" alt="${data.schoolName}" class="logo">
            <h1>${data.reportTitle}</h1>
          </div>

          <div class="report-meta">
            <p><strong>Student:</strong> ${data.studentName}</p>
            <p><strong>Class:</strong> ${data.className}</p>
            <p><strong>Teacher:</strong> ${data.teacherName}</p>
            <p><strong>Period:</strong> ${dayjs(data.startDate).format(
              "MMM D, YYYY"
            )} - ${dayjs(data.endDate).format("MMM D, YYYY")}</p>
          </div>

          <div class="report-content">
            ${sanitizedContent}
          </div>

          <div class="footer">
            <p>This report was generated on ${dayjs().format(
              "MMM D, YYYY [at] HH:mm"
            )}.</p>
            <p>For any questions, please contact ${
              data.schoolName
            } administration.</p>
          </div>
        </body>
      </html>
    `,
  };
};

export const buildReminderTemplate = (data) => {
  return {
    subject: `New Report Available - ${data.schoolName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { 
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .button {
              display: inline-block;
              padding: 10px 20px;
              background-color: #4CAF50;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <h2>New Report Available</h2>
          <p>Dear Parent/Guardian,</p>
          <p>A new ${data.reportType} report is available for ${data.studentName}.</p>
          <p>Please click the button below to view the report:</p>
          <a href="${data.reportUrl}" class="button">View Report</a>
          <p>If you cannot click the button, copy and paste this link into your browser:</p>
          <p>${data.reportUrl}</p>
          <p>Best regards,<br>${data.teacherName}<br>${data.schoolName}</p>
        </body>
      </html>
    `,
  };
};
