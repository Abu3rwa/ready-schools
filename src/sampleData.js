// Sample data for development and testing
export const sampleData = {
  students: [
    {
      id: "student1",
      firstName: "John",
      lastName: "Doe",
      grade: "5",
      section: "A",
      email: "john.doe@example.com",
      studentEmail: "john.doe@school.edu"
    },
    {
      id: "student2",
      firstName: "Jane",
      lastName: "Smith",
      grade: "5",
      section: "A",
      email: "jane.smith@example.com",
      studentEmail: "jane.smith@school.edu"
    }
  ],
  assignments: [
    {
      id: "assignment1",
      name: "Reading a Text",
      subject: "English",
      category: "Class Discussion",
      points: 10,
      dueDate: new Date().toISOString().split('T')[0]
    },
    {
      id: "assignment2",
      name: "Writing story",
      subject: "English",
      category: "Homework",
      points: 10,
      dueDate: new Date().toISOString().split('T')[0]
    },
    {
      id: "assignment3",
      name: "Literature Quiz",
      subject: "English",
      category: "Quiz",
      points: 9,
      dueDate: new Date().toISOString().split('T')[0]
    }
  ],
  englishGrades: [
    {
      id: "grade1",
      studentId: "student1",
      assignmentId: "assignment1",
      subject: "English",
      score: 9,
      points: 10,
      dateEntered: new Date().toISOString().split('T')[0]
    },
    {
      id: "grade2",
      studentId: "student1",
      assignmentId: "assignment2",
      subject: "English",
      score: 8,
      points: 10,
      dateEntered: new Date().toISOString().split('T')[0]
    },
    {
      id: "grade3",
      studentId: "student2",
      assignmentId: "assignment1",
      subject: "English",
      score: 10,
      points: 10,
      dateEntered: new Date().toISOString().split('T')[0]
    }
  ],
  socialStudiesGrades: []
};