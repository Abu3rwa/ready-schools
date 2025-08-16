# Daily Update Email Attachments Guide

## Overview
This guide explains how to attach PDFs to daily update emails. The system supports two types of attachments:
1. Auto-generated PDF reports (created by the system)
2. Custom PDF attachments (uploaded by teachers)

## File Structure
```
storage/
└── daily_update_attachments/
    └── templates/
        ├── student_reports/
        │   └── {studentId}/
        │       └── {date}_report.pdf
        └── class_materials/
            └── {date}/
                └── {filename}.pdf
```

## Attachment Types

### 1. Student Report PDFs
- Location: `storage/daily_update_attachments/templates/student_reports/{studentId}/{date}_report.pdf`
- Purpose: Individual student progress reports
- Naming Convention: `YYYY-MM-DD_report.pdf`
- Example: `2024-03-15_report.pdf`

### 2. Class Materials
- Location: `storage/daily_update_attachments/templates/class_materials/{date}/{filename}.pdf`
- Purpose: Supplementary materials, worksheets, or resources
- Naming Convention: Descriptive filename with date prefix
- Example: `2024-03-15_math_worksheet.pdf`

## Usage Instructions

### Adding Custom Attachments
1. Create the appropriate folder structure in Firebase Storage
2. Upload PDF files using the following naming conventions:
   - Student Reports: `{date}_report.pdf`
   - Class Materials: `{date}_{descriptive_name}.pdf`

### Attaching Files to Emails
```javascript
// Example code for attaching files
const emailOptions = {
  to: parentEmails,
  subject: emailSubject,
  html: emailContent,
  attachments: [
    // Auto-generated report
    {
      filename: `${studentName}_Daily_Report_${date}.pdf`,
      content: reportBuffer,
      contentType: 'application/pdf'
    },
    // Custom attachments from storage
    {
      filename: 'Math_Worksheet.pdf',
      path: `daily_update_attachments/templates/class_materials/${date}/math_worksheet.pdf`,
      contentType: 'application/pdf'
    }
  ]
};
```

## Storage Rules
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /daily_update_attachments/{allPaths=**} {
      // Allow read access to authenticated users
      allow read: if request.auth != null;
      
      // Allow write access only to teachers
      allow write: if request.auth != null 
        && request.auth.token.role == 'teacher';
      
      // Validate file type and size
      allow write: if request.resource.contentType.matches('application/pdf')
        && request.resource.size <= 10 * 1024 * 1024; // 10MB limit
    }
  }
}
```

## Best Practices

### File Management
1. **Organization**
   - Keep files organized by date and type
   - Use consistent naming conventions
   - Clean up old files periodically

2. **File Size**
   - Keep PDFs under 10MB
   - Optimize PDFs before uploading
   - Consider splitting large documents

3. **Naming Conventions**
   - Use date prefixes: `YYYY-MM-DD_`
   - Use descriptive names
   - Avoid spaces (use underscores)
   - Keep filenames lowercase

### Security
1. **Access Control**
   - Only authenticated users can read files
   - Only teachers can upload files
   - Validate file types and sizes

2. **Data Privacy**
   - Don't include sensitive information in filenames
   - Use student IDs instead of names in paths
   - Regularly audit access logs

### Performance
1. **Optimization**
   - Compress PDFs before upload
   - Cache frequently used files
   - Clean up unused files

2. **Rate Limiting**
   - Limit number of attachments per email
   - Implement upload quotas
   - Monitor storage usage

## Implementation Example

```javascript
// Example function to get attachments for a daily update email
async function getDailyUpdateAttachments(studentId, date) {
  const attachments = [];
  
  // 1. Add auto-generated report
  const reportBuffer = await generateStudentReport(studentId, date);
  if (reportBuffer) {
    attachments.push({
      filename: `Daily_Report_${date}.pdf`,
      content: reportBuffer,
      contentType: 'application/pdf'
    });
  }
  
  // 2. Add custom class materials
  const classMaterials = await getClassMaterials(date);
  for (const material of classMaterials) {
    attachments.push({
      filename: material.name,
      path: material.path,
      contentType: 'application/pdf'
    });
  }
  
  return attachments;
}

// Example function to get class materials from storage
async function getClassMaterials(date) {
  const formattedDate = dayjs(date).format('YYYY-MM-DD');
  const materialsPath = `daily_update_attachments/templates/class_materials/${formattedDate}`;
  
  try {
    const files = await listFiles(materialsPath);
    return files.map(file => ({
      name: file.name,
      path: file.fullPath
    }));
  } catch (error) {
    console.error('Error getting class materials:', error);
    return [];
  }
}
```

## Troubleshooting

### Common Issues
1. **File Not Found**
   - Check file path is correct
   - Verify file exists in storage
   - Check access permissions

2. **Upload Failures**
   - Verify file size is under limit
   - Check file type is PDF
   - Confirm teacher has upload permissions

3. **Attachment Errors**
   - Verify email service configuration
   - Check attachment format
   - Monitor email size limits

### Support
For issues or questions:
1. Check logs in Firebase Console
2. Review storage rules
3. Verify file permissions
4. Contact system administrator
