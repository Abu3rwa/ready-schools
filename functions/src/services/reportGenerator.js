import PDFDocument from 'pdfkit';

export class ReportGenerator {
  constructor() {
    this.doc = null;
  }

  async generateDailyReport(studentData) {
    return new Promise((resolve, reject) => {
      try {
        // Create a new PDF document
        this.doc = new PDFDocument();
        const chunks = [];

        // Collect the PDF data chunks
        this.doc.on('data', chunk => chunks.push(chunk));
        this.doc.on('end', () => {
          const pdfBuffer = Buffer.concat(chunks);
          resolve(pdfBuffer);
        });

        // Add content to the PDF
        this.addHeader(studentData);
        this.addAttendanceSection(studentData);
        this.addGradesSection(studentData);
        this.addBehaviorSection(studentData);
        this.addAssignmentsSection(studentData);
        this.addFooter(studentData);

        // Finalize the PDF
        this.doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  addHeader(data) {
    const { schoolName, studentName, date } = data;
    
    this.doc
      .fontSize(24)
      .text(schoolName, { align: 'center' })
      .fontSize(18)
      .text('Daily Progress Report', { align: 'center' })
      .fontSize(14)
      .text(`Student: ${studentName}`, { align: 'center' })
      .text(`Date: ${date}`, { align: 'center' })
      .moveDown();
  }

  addAttendanceSection(data) {
    const { attendance } = data;
    
    this.doc
      .fontSize(16)
      .text('Attendance', { underline: true })
      .fontSize(12)
      .text(`Status: ${attendance.status}`)
      .text(`Notes: ${attendance.notes || 'No notes'}`)
      .moveDown();
  }

  addGradesSection(data) {
    const { grades, subjectGrades } = data;
    
    this.doc
      .fontSize(16)
      .text('Grades', { underline: true })
      .fontSize(12);

    if (subjectGrades && Object.keys(subjectGrades).length > 0) {
      this.doc.text('Subject Averages:');
      Object.entries(subjectGrades).forEach(([subject, grade]) => {
        this.doc.text(`${subject}: ${grade}%`);
      });
    }

    if (grades && grades.length > 0) {
      this.doc.moveDown().text('Today\'s Grades:');
      grades.forEach(grade => {
        if (grade.points && grade.points > 0) {
          const percentage = Math.round((grade.score / grade.points) * 100);
          this.doc.text(`${grade.assignmentName}: ${grade.score}/${grade.points} (${percentage}%)`);
        } else {
          this.doc.text(`${grade.assignmentName}: ${grade.score} points`);
        }
      });
    }

    this.doc.moveDown();
  }

  addBehaviorSection(data) {
    const { behavior } = data;
    
    this.doc
      .fontSize(16)
      .text('Behavior', { underline: true })
      .fontSize(12);

    if (behavior && behavior.length > 0) {
      behavior.forEach(incident => {
        this.doc
          .text(`Type: ${incident.type}`)
          .text(`Description: ${incident.description}`)
          .text(`Action Taken: ${incident.actionTaken || 'None'}`)
          .moveDown();
      });
    } else {
      this.doc.text('No behavior incidents recorded today.');
    }

    this.doc.moveDown();
  }

  addAssignmentsSection(data) {
    const { assignments, upcomingAssignments } = data;
    
    this.doc
      .fontSize(16)
      .text('Assignments', { underline: true })
      .fontSize(12);

    if (assignments && assignments.length > 0) {
      this.doc.text('Today\'s Assignments:');
      assignments.forEach(assignment => {
        this.doc
          .text(`Name: ${assignment.name}`)
          .text(`Subject: ${assignment.subject}`)
          .text(`Due Date: ${assignment.dueDate || 'Not specified'}`)
          .moveDown();
      });
    }

    if (upcomingAssignments && upcomingAssignments.length > 0) {
      this.doc.text('Upcoming Assignments:');
      upcomingAssignments.forEach(assignment => {
        this.doc
          .text(`Name: ${assignment.name}`)
          .text(`Subject: ${assignment.subject}`)
          .text(`Due Date: ${assignment.dueDate}`)
          .moveDown();
      });
    }
  }

  addFooter(data) {
    const { teacherName, schoolName } = data;
    
    this.doc
      .moveDown()
      .fontSize(10)
      .text('This report was automatically generated.', { align: 'center' })
      .text(`Teacher: ${teacherName}`, { align: 'center' })
      .text(`School: ${schoolName}`, { align: 'center' })
      .text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });
  }
}

export default new ReportGenerator();
