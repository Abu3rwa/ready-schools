import { getStorage } from "firebase-admin/storage";
import dayjs from 'dayjs';

class AttachmentService {
  constructor() {
    // Don't initialize Firebase Admin services in constructor
    this.storage = null;
    this.bucket = null;
  }

  // Lazy initialization of Storage
  getStorage() {
    if (!this.storage) {
      this.storage = getStorage();
    }
    return this.storage;
  }

  // Lazy initialization of bucket
  getBucket() {
    if (!this.bucket) {
      this.bucket = this.getStorage().bucket('smile3-8c8c5.firebasestorage.app');
    }
    return this.bucket;
  }

  /**
   * Get attachments for a daily update email
   * @param {string} studentId - The student's ID
   * @param {string} date - The date in YYYY-MM-DD format
   * @returns {Promise<Array>} Array of attachment objects
   */
  async getDailyUpdateAttachments(studentId, date) {
    try {
      const attachments = [];
      const formattedDate = dayjs(date).format('YYYY-MM-DD');

      // 1. Get student-specific report if exists
      const studentReport = await this.getStudentReport(studentId, formattedDate);
      if (studentReport) {
        attachments.push(studentReport);
      }

      // 2. Get class materials for the date
      const classMaterials = await this.getClassMaterials(formattedDate);
      attachments.push(...classMaterials);

      return attachments;
    } catch (error) {
      console.error('Error getting daily update attachments:', error);
      return [];
    }
  }

  /**
   * Get student report from storage
   * @param {string} studentId - The student's ID
   * @param {string} date - The date in YYYY-MM-DD format
   * @returns {Promise<Object|null>} Attachment object or null
   */
  async getStudentReport(studentId, date) {
    try {
      const path = `daily_update_attachments/templates/student_reports/${studentId}/${date}_report.pdf`;
      const file = this.getBucket().file(path);
      const exists = await file.exists();

      if (!exists[0]) {
        return null;
      }

      return {
        filename: `Daily_Report_${date}.pdf`,
        path: path,
        contentType: 'application/pdf'
      };
    } catch (error) {
      console.error('Error getting student report:', error);
      return null;
    }
  }

  /**
   * Get class materials from storage
   * @param {string} date - The date in YYYY-MM-DD format
   * @returns {Promise<Array>} Array of attachment objects
   */
  async getClassMaterials(date) {
    try {
      const path = `daily_update_attachments/templates/class_materials/${date}`;
      const [files] = await this.getBucket().getFiles({ prefix: path });

      return files.map(file => ({
        filename: file.name.split('/').pop(),
        path: file.name,
        contentType: 'application/pdf'
      }));
    } catch (error) {
      console.error('Error getting class materials:', error);
      return [];
    }
  }

  /**
   * Upload a PDF file to storage
   * @param {Buffer} fileBuffer - The file content
   * @param {string} path - The storage path
   * @returns {Promise<boolean>} Success status
   */
  async uploadPDF(fileBuffer, path) {
    try {
      const file = this.getBucket().file(path);
      await file.save(fileBuffer, {
        metadata: {
          contentType: 'application/pdf'
        }
      });
      return true;
    } catch (error) {
      console.error('Error uploading PDF:', error);
      return false;
    }
  }

  /**
   * Delete a file from storage
   * @param {string} path - The storage path
   * @returns {Promise<boolean>} Success status
   */
  async deleteFile(path) {
    try {
      const file = this.getBucket().file(path);
      await file.delete();
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }
}

export default new AttachmentService();
