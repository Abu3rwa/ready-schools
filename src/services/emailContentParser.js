import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Email Content Parser Service
 * Extracts character trait quotes and challenges from daily update emails
 */
class EmailContentParser {
  /**
   * Extract quote from email HTML content
   * @param {string} emailHtml - HTML content of the email
   * @returns {string|null} - Extracted quote or null if not found
   */
  extractQuote(emailHtml) {
    try {
      // Create a temporary DOM element to parse HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(emailHtml, 'text/html');
      
      // Method 1: Look for the specific structure from the actual email
      // Find "Today's Quote" text and get the next sibling div
      const allDivs = doc.querySelectorAll('div');
      for (let i = 0; i < allDivs.length; i++) {
        const div = allDivs[i];
        const text = div.textContent?.trim();
        
        // Look for "Today's Quote" or similar patterns
        if (text && (text.includes('Today\'s Quote') || text.includes('💫 Today\'s Quote'))) {
          // Check the next div for the quote content
          const nextDiv = allDivs[i + 1];
          if (nextDiv) {
            let quoteText = nextDiv.textContent?.trim();
            if (quoteText && quoteText.length > 5) {
              // Clean up the quote
              quoteText = quoteText.replace(/^[""''""]|[""''""]$/g, '').trim();
              return this.decodeHtmlEntities(quoteText);
            }
          }
        }
      }
      
      // Method 2: Try regex pattern matching for the specific structure
      // Look for the pattern: Today's Quote followed by a div with the quote
      const quoteRegex = /💫\s*Today['']s\s*Quote[\s\S]*?<div[^>]*style[^>]*italic[^>]*>([^<]*)/i;
      const quoteMatch = emailHtml.match(quoteRegex);
      
      if (quoteMatch) {
        let quote = quoteMatch[1];
        // Clean up HTML tags and decode entities
        quote = quote.replace(/<[^>]*>/g, '').trim();
        quote = this.decodeHtmlEntities(quote);
        // Remove extra whitespace and quotes
        quote = quote.replace(/^[""''""]|[""''""]$/g, '').trim();
        return quote || null;
      }
      
      // Method 3: Fallback - Search for any italic text that looks like a quote
      const italicElements = doc.querySelectorAll('div[style*="italic"], em, i');
      for (const element of italicElements) {
        const text = element.textContent?.trim();
        if (text && text.length > 10 && (text.includes('"') || text.includes('!'))) {
          return this.decodeHtmlEntities(text.replace(/^[""''""]|[""''""]$/g, '').trim());
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error extracting quote:', error);
      return null;
    }
  }

  /**
   * Extract challenge from email HTML content
   * @param {string} emailHtml - HTML content of the email
   * @returns {string|null} - Extracted challenge or null if not found
   */
  extractChallenge(emailHtml) {
    try {
      // Create a temporary DOM element to parse HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(emailHtml, 'text/html');
      
      // Method 1: Look for the specific structure from the actual email
      // Find "Today's Challenge" text and get the next sibling div
      const allDivs = doc.querySelectorAll('div');
      for (let i = 0; i < allDivs.length; i++) {
        const div = allDivs[i];
        const text = div.textContent?.trim();
        
        // Look for "Today's Challenge" or similar patterns
        if (text && (text.includes('Today\'s Challenge') || text.includes('🎯 Today\'s Challenge'))) {
          // Check the next div for the challenge content
          const nextDiv = allDivs[i + 1];
          if (nextDiv) {
            let challengeText = nextDiv.textContent?.trim();
            if (challengeText && challengeText.length > 5) {
              return this.decodeHtmlEntities(challengeText);
            }
          }
        }
      }
      
      // Method 2: Try regex pattern matching for the specific structure
      const challengeRegex = /🎯\s*Today['']s\s*Challenge[\s\S]*?<div[^>]*>([^<]*)/i;
      const challengeMatch = emailHtml.match(challengeRegex);
      
      if (challengeMatch) {
        let challenge = challengeMatch[1];
        // Clean up HTML tags and decode entities
        challenge = challenge.replace(/<[^>]*>/g, '').trim();
        challenge = this.decodeHtmlEntities(challenge);
        return challenge || null;
      }
      
      // Method 3: Fallback - Look for challenge-related content
      for (const div of allDivs) {
        const text = div.textContent?.trim();
        if (text && text.toLowerCase().includes('challenge') && text.length > 20) {
          // Extract the actual challenge text (usually after "Today's Challenge")
          const challengeText = text.replace(/.*Today['']s\s*Challenge[:\s]*/i, '').trim();
          if (challengeText.length > 5) {
            return this.decodeHtmlEntities(challengeText);
          }
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error extracting challenge:', error);
      return null;
    }
  }

  /**
   * Extract character trait name from email HTML content
   * @param {string} emailHtml - HTML content of the email
   * @returns {string|null} - Extracted character trait or null if not found
   */
  extractCharacterTrait(emailHtml) {
    try {
      // Look for "Character Trait of the Month" section
      const traitRegex = /🌟\s*Character\s*Trait\s*of\s*the\s*Month[:\s]*([\w\s]+)/i;
      const traitMatch = emailHtml.match(traitRegex);
      
      if (traitMatch) {
        return traitMatch[1].trim();
      }
      
      // Fallback: Look for common character traits in the content
      const commonTraits = [
        'Perseverance', 'Integrity', 'Respect', 'Responsibility', 'Kindness',
        'Courage', 'Honesty', 'Empathy', 'Leadership', 'Creativity',
        'Resilience', 'Gratitude', 'Patience', 'Cooperation', 'Excellence'
      ];
      
      const parser = new DOMParser();
      const doc = parser.parseFromString(emailHtml, 'text/html');
      const fullText = doc.body?.textContent || '';
      
      for (const trait of commonTraits) {
        if (fullText.toLowerCase().includes(trait.toLowerCase())) {
          return trait;
        }
      }
      
      return 'Character Development'; // Default fallback
    } catch (error) {
      console.error('Error extracting character trait:', error);
      return 'Character Development';
    }
  }

  /**
   * Debug function to get all available emails and their dates
   * @param {string} userId - Teacher's user ID
   * @returns {Promise<Array>} - Array of available emails with dates
   */
  async debugGetAllEmails(userId) {
    try {
      const emailsRef = collection(db, 'dailyUpdateEmails');
      const q = query(
        emailsRef,
        where('userId', '==', userId),
        orderBy('date', 'desc'),
        limit(10)
      );
      
      const emailsSnapshot = await getDocs(q);
      const emails = [];
      
      emailsSnapshot.forEach((doc) => {
        const emailData = doc.data();
        emails.push({
          id: doc.id,
          date: emailData.date,
          studentId: emailData.studentId,
          studentName: emailData.studentName,
          sentStatus: emailData.sentStatus,
          hasHtml: !!emailData.html,
          htmlLength: emailData.html?.length || 0
        });
      });
      
      return emails;
    } catch (error) {
      console.error('Error getting debug emails:', error);
      return [];
    }
  }

  /**
   * Create sample character trait content for testing
   * @param {string} userId - Teacher's user ID
   * @param {Array} students - Array of students
   * @returns {Promise<Array>} - Array of sample content
   */
  async createSampleContent(userId, students) {
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      const sampleQuotes = [
        "Success is not final, failure is not fatal: it is the courage to continue that counts.",
        "The only way to do great work is to love what you do.",
        "Believe you can and you're halfway there.",
        "It does not matter how slowly you go as long as you do not stop.",
        "The future belongs to those who believe in the beauty of their dreams."
      ];
      
      const sampleChallenges = [
        "Practice kindness by helping someone without expecting anything in return.",
        "Show perseverance by not giving up on a difficult task today.",
        "Demonstrate respect by listening carefully to others without interrupting.",
        "Take responsibility by admitting a mistake and working to fix it.",
        "Display courage by standing up for what is right, even when it's difficult."
      ];
      
      const sampleContent = students.map((student, index) => ({
        studentId: student.id,
        studentName: `${student.firstName} ${student.lastName}`,
        emailDate: yesterdayStr,
        quote: sampleQuotes[index % sampleQuotes.length],
        challenge: sampleChallenges[index % sampleChallenges.length],
        characterTrait: 'Perseverance',
        emailId: `sample_${student.id}`
      }));
      
      return sampleContent;
    } catch (error) {
      console.error('Error creating sample content:', error);
      return [];
    }
  }

  /**
   * Get yesterday's character trait content for all students
   * @param {string} userId - Teacher's user ID
   * @returns {Promise<Array>} - Array of student character trait content
   */
  async getYesterdayContent(userId) {
    try {
      // Calculate yesterday's date
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0]; // YYYY-MM-DD format
      
      // Query emails from yesterday
      const emailsRef = collection(db, 'dailyUpdateEmails');
      const q = query(
        emailsRef,
        where('userId', '==', userId),
        where('date', '==', yesterdayStr),
        where('sentStatus', '==', 'sent'),
        orderBy('createdAt', 'desc')
      );
      
      const emailsSnapshot = await getDocs(q);
      const studentContent = [];
      
      emailsSnapshot.forEach((doc) => {
        const emailData = doc.data();
        
        // Extract character trait content from HTML
        const quote = this.extractQuote(emailData.html || '');
        const challenge = this.extractChallenge(emailData.html || '');
        const characterTrait = this.extractCharacterTrait(emailData.html || '');
        
        // Only include if we found at least a quote or challenge
        if (quote || challenge) {
          studentContent.push({
            studentId: emailData.studentId,
            studentName: emailData.studentName,
            emailDate: yesterdayStr,
            quote: quote || '',
            challenge: challenge || '',
            characterTrait: characterTrait || 'Character Development',
            emailId: doc.id
          });
        }
      });
      
      return studentContent;
    } catch (error) {
      console.error('Error getting yesterday\'s content:', error);
      return [];
    }
  }

  /**
   * Get character trait content for a specific date
   * @param {string} userId - Teacher's user ID
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {Promise<Array>} - Array of student character trait content
   */
  async getContentForDate(userId, date) {
    try {
      const emailsRef = collection(db, 'dailyUpdateEmails');
      const q = query(
        emailsRef,
        where('userId', '==', userId),
        where('date', '==', date),
        where('sentStatus', '==', 'sent'),
        orderBy('createdAt', 'desc')
      );
      
      const emailsSnapshot = await getDocs(q);
      const studentContent = [];
      
      emailsSnapshot.forEach((doc) => {
        const emailData = doc.data();
        
        const quote = this.extractQuote(emailData.html || '');
        const challenge = this.extractChallenge(emailData.html || '');
        const characterTrait = this.extractCharacterTrait(emailData.html || '');
        
        if (quote || challenge) {
          studentContent.push({
            studentId: emailData.studentId,
            studentName: emailData.studentName,
            emailDate: date,
            quote: quote || '',
            challenge: challenge || '',
            characterTrait: characterTrait || 'Character Development',
            emailId: doc.id
          });
        }
      });
      
      return studentContent;
    } catch (error) {
      console.error('Error getting content for date:', error);
      return [];
    }
  }

  /**
   * Decode HTML entities
   * @param {string} text - Text with HTML entities
   * @returns {string} - Decoded text
   */
  decodeHtmlEntities(text) {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
  }

  /**
   * Test the parser with sample email content
   * @param {string} emailHtml - Sample email HTML
   * @returns {object} - Extracted content for testing
   */
  testParser(emailHtml) {
    return {
      quote: this.extractQuote(emailHtml),
      challenge: this.extractChallenge(emailHtml),
      characterTrait: this.extractCharacterTrait(emailHtml)
    };
  }

  /**
   * Test with the actual email sample provided
   * @returns {object} - Extracted content from real email
   */
  testWithRealEmail() {
    const realEmailHtml = `<!DOCTYPE html> <html> <head> <meta charset="utf-8" /> <meta name="viewport" content="width=device-width, initial-scale=1" /> <style> body { margin: 0 !important; padding: 0 !important; background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%) !important; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important; color: #2c3e50 !important; font-size: 16px !important; line-height: 1.6 !important; } .email-container { max-width: 680px !important; margin: 20px auto !important; background: #ffffff !important; border-radius: 20px !important; box-shadow: 0 8px 32px rgba(0,0,0,0.1) !important; overflow: hidden !important; } .header { background: linear-gradient(135deg, #1459a9 0%, #0d3d7a 100%) !important; color: #fff !important; padding: 28px 24px !important; text-align: center !important; } .school-title { margin: 0 !important; font-weight: 800 !important; font-size: 28px !important; } .date-badge { margin-top: 12px !important; font-size: 14px !important; font-weight: 500 !important; background: rgba(255,255,255,0.2) !important; padding: 8px 16px !important; border-radius: 20px !important; display: inline-block !important; } .content { padding: 32px 24px !important; background: #ffffff !important; } .section { margin: 24px 0 !important; border: none !important; border-radius: 16px !important; background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%) !important; box-shadow: 0 4px 16px rgba(0,0,0,0.08) !important; overflow: hidden !important; } .section-title { background: linear-gradient(135deg, #1459a9 0%, #0d3d7a 100%) !important; color: #fff !important; padding: 16px 20px !important; font-weight: 700 !important; font-size: 16px !important; } .section-content { padding: 20px !important; background: #ffffff !important; } .hero-banner { background: linear-gradient(135deg, #1459a9 0%, #0d3d7a 100%) !important; border: 3px solid #1459a9 !important; border-radius: 20px !important; padding: 24px 28px !important; margin: 0 0 24px 0 !important; box-shadow: 0 6px 20px rgba(20, 89, 169, 0.2) !important; } .stars-earned { background: linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%) !important; border: 2px solid #ed2024 !important; border-radius: 16px !important; padding: 16px !important; margin: 20px 0 !important; box-shadow: 0 4px 16px rgba(237, 32, 36, 0.2) !important; } .grades-section { background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%) !important; border: 2px solid #1459a9 !important; border-radius: 16px !important; padding: 20px !important; margin: 24px 0 !important; box-shadow: 0 4px 16px rgba(20, 89, 169, 0.15) !important; } .lessons-section { background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%) !important; border: 2px solid #1459a9 !important; border-radius: 16px !important; padding: 20px !important; margin: 24px 0 !important; box-shadow: 0 4px 16px rgba(20, 89, 169, 0.15) !important; } .assignments-section { background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%) !important; border: 2px solid #ed2024 !important; border-radius: 16px !important; padding: 20px !important; margin: 24px 0 !important; box-shadow: 0 4px 16px rgba(237, 32, 36, 0.15) !important; } .attendance-section { background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%) !important; border: 2px solid #1459a9 !important; border-radius: 16px !important; padding: 20px !important; margin: 24px 0 !important; box-shadow: 0 4px 16px rgba(20, 89, 169, 0.15) !important; } .behavior-section { background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%) !important; border: 2px solid #ed2024 !important; border-radius: 16px !important; padding: 20px !important; margin: 24px 0 !important; box-shadow: 0 4px 16px rgba(237, 32, 36, 0.15) !important; } .reminders-section { background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%) !important; border: 2px solid #1459a9 !important; border-radius: 16px !important; padding: 20px !important; margin: 24px 0 !important; box-shadow: 0 4px 16px rgba(20, 89, 169, 0.15) !important; } .footer { margin-top: 32px !important; padding-top: 20px !important; border-top: 2px solid #1459a9 !important; font-size: 14px !important; color: #7f8c8d !important; background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%) !important; border-radius: 16px !important; padding: 20px !important; } .section-header { font-size: 20px !important; font-weight: 700 !important; color: #1459a9 !important; margin: 0 0 12px 0 !important; display: flex !important; align-items: center !important; gap: 8px !important; } ul { margin: 12px 0 !important; padding-left: 24px !important; color: #34495e !important; } li { margin: 8px 0 !important; line-height: 1.5 !important; } p { margin: 0 0 16px 0 !important; color: #34495e !important; } @media only screen and (max-width: 600px) { .content { padding: 20px 16px !important; } .header { padding: 20px 16px !important; } .school-title { font-size: 24px !important; } } </style> </head> <body> <div class="email-container"> <div class="header"> <h2 class="school-title">AMLY School</h2> <div class="date-badge">Sunday, August 24, 2025</div> </div> <div class="content"> <!-- Dynamic Personalized Greeting with Hero Banner Style --> <div style="margin:24px 0; padding:24px; background:linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius:20px; border:3px solid #1459a9; box-shadow:0 6px 20px rgba(20, 89, 169, 0.2);"> <h1 style="margin:0 0 12px 0; font-size:24px; color:#1459a9; text-align:center; font-weight:700;"> Hello Fatima! Let's see what you've learned! 🧠 </h1> <p style="margin:0; font-size:16px; color:#34495e; text-align:center; font-weight:500;"> Your positive energy is contagious! 🌟 </p> </div> <!-- Additional Personalized Message --> <div style="margin:20px 0; padding:20px; background:linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius:16px; border:2px solid #1459a9;"> <p style="margin:0; font-size:16px; color:#1459a9; font-weight:600;"> Here's your incredible daily summary - you're doing fantastic things! Keep that amazing energy flowing! ✨🚀 </p> </div> <!-- Today's Achievements --> <div style="margin:16px 0; padding:14px; border-radius:10px; background:#fff3cd; border:1px solid #ffeaa7; color:#856404;"> <strong>🎉 Today's Amazing Achievements 🎉</strong><br> You have upcoming work — planning ahead shows real leadership! ⏰📋 </div> <!-- Stars Earned --> <div class="stars-earned"> <div style="text-align:center; font-size:18px; font-weight:700; color:#ed2024;"> 🎊 ⭐⭐⭐ Incredible! You earned 3 stars today! ⭐⭐⭐ </div> </div> <!-- Learning Progress --> <div style="margin:16px 0;"> <div style="font-weight:800; color:#d32f2f; margin-bottom:8px;">📈 Learning Progress</div> <div style="background:#eceff1; border-radius:12px; height:16px; overflow:hidden; border:1px solid #d32f2f;"> <div style="width:92%; height:16px; background:#2e7d32;"></div> </div> <div style="font-size:13px; color:#1459a9; margin-top:8px;">Current average: <strong>92%</strong> • On fire! 🔥</div> </div> <!-- Focus Tip --> <div style="margin:16px 0;"> <div style="font-weight:800; color:#1459a9; margin-bottom:8px;">🎯 Focus Tip</div> </div> <!-- Motivation & Challenge Section --> <div class="section" style="border-color:#c8e6c9; background:#f1f8f2;"> <div class="section-title" style="background:#2e7d32;">🌟 Character Trait of the Month</div> <div class="section-content" style="color:#1b5e20;"> <div style="margin:16px 0;"> <div style="font-weight:600; color:#2e7d32; margin-bottom:8px;">💫 Today's Quote</div> <div style="font-style:italic; color:#1b5e20; padding:12px; background:rgba(255,255,255,0.7); border-radius:8px; border-left:4px solid #2e7d32;"> "Learning is a journey, not a destination. Enjoy the ride! 🛤️" </div> </div> <div style="margin:16px 0;"> <div style="font-weight:600; color:#2e7d32; margin-bottom:8px;">🎯 Today's Challenge</div> <div style="color:#1b5e20; padding:12px; background:rgba(255,255,255,0.7); border-radius:8px; border-left:4px solid #2e7d32;"> Find 3 new words while reading and use one in a sentence 📖 </div> </div> </div> </div>`;
    
    return this.testParser(realEmailHtml);
  }
  /**
   * Test with the user's provided email content
   * @returns {object} - Extracted content from the user's email
   */
  testWithUserEmail() {
    const userEmailHtml = `<!DOCTYPE html> <html> <head> <meta charset="utf-8" /> <meta name="viewport" content="width=device-width, initial-scale=1" /> <style> body { margin: 0 !important; padding: 0 !important; background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%) !important; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important; color: #2c3e50 !important; font-size: 16px !important; line-height: 1.6 !important; } </style> </head> <body> <div class="email-container"> <div class="header"> <h2 class="school-title">AMLY School</h2> <div class="date-badge">Monday, August 25, 2025</div> </div> <div class="content"> <!-- Motivation & Challenge Section --> <div class="section" style="border-color:#c8e6c9; background:#f1f8f2;"> <div class="section-title" style="background:#2e7d32;">🌟 Character Trait of the Month</div> <div class="section-content" style="color:#1b5e20;"> <div style="margin:16px 0;"> <div style="font-weight:600; color:#2e7d32; margin-bottom:8px;">💫 Today's Quote</div> <div style="font-style:italic; color:#1b5e20; padding:12px; background:rgba(255,255,255,0.7); border-radius:8px; border-left:4px solid #2e7d32;"> "Learning happens when you're brave enough to ask" </div> </div> <div style="margin:16px 0;"> <div style="font-weight:600; color:#2e7d32; margin-bottom:8px;">🎯 Today's Challenge</div> <div style="color:#1b5e20; padding:12px; background:rgba(255,255,255,0.7); border-radius:8px; border-left:4px solid #2e7d32;"> Try to learn one new thing about a friend today </div> </div> </div> </div> </div> </div> </body> </html>`;
    
    const result = this.testParser(userEmailHtml);
    console.log('🧪 User Email Parser Test Results:', result);
    return result;
  }
}

// Export singleton instance
export const emailContentParser = new EmailContentParser();
export default emailContentParser;