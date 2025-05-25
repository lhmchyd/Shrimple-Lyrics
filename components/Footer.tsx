
import React, { useState } from 'react';
import Modal from './Modal';
import MarkdownRenderer from './MarkdownRenderer';

const getCurrentYear = () => new Date().getFullYear();
const APP_NAME = "Shrimple Lyric";
const LAST_UPDATED_DATE = new Date().toLocaleDateString();

const PRIVACY_POLICY_TITLE = "Privacy Policy";
const PRIVACY_POLICY_CONTENT = `
# Privacy Policy for ${APP_NAME}

Last updated: ${LAST_UPDATED_DATE}

Thank you for using ${APP_NAME} ("Application", "we", "us", or "our"). This Privacy Policy explains how we handle your information when you use our Application.

**Information We Collect**

*   **Search Queries:** We process the search queries you enter to fetch lyrics and related information. These queries are sent to the Gemini API.
*   **Locally Stored Data:** Your search history and cached search results are stored locally on your device using IndexedDB. This data is not transmitted to us or any third party, except for the queries sent to the Gemini API as part of the search functionality.
*   **Usage Data (Gemini API):** Google may collect data related to your use of the Gemini API as per their own terms of service and privacy policy. We do not have access to this specific data beyond what is necessary to provide the search results.

**How We Use Your Information**

*   To provide and maintain the Application's functionality (e.g., searching for lyrics).
*   To improve the Application.
*   To store your search history and cache results locally for your convenience and offline access.

**Data Sharing and Disclosure**

We do not share your personal information with third parties, except:
*   **Gemini API:** Your search queries are sent to Google's Gemini API to retrieve results. Please review Google's Privacy Policy for information on how they handle data.
*   **Legal Requirements:** We may disclose your information if required to do so by law or in response to valid requests by public authorities.

**Data Storage and Security**

Search history and cached results are stored locally on your device's browser using IndexedDB. While we strive to use commercially acceptable means to protect your data, remember that no method of transmission over the Internet or method of electronic storage is 100% secure.

**Your Choices**

You can clear your search history and cached results at any time through the Application's interface.

**Changes to This Privacy Policy**

We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy within the Application. You are advised to review this Privacy Policy periodically for any changes.

**Contact Us**

If you have any questions about this Privacy Policy, please understand this is a sample application and not a commercial product.
`;

const COOKIE_POLICY_TITLE = "Cookie Policy";
const COOKIE_POLICY_CONTENT = `
# Cookie Policy for ${APP_NAME}

Last updated: ${LAST_UPDATED_DATE}

This Cookie Policy explains what cookies are and how ${APP_NAME} ("Application", "we", "us", or "our") uses them.

**What Are Cookies?**

Cookies are small text files that are placed on your computer or mobile device when you visit a website or use an application. They are widely used to make websites and applications work, or work more efficiently, as well as to provide information to the owners of the site/application.

**Does ${APP_NAME} Use Cookies?**

${APP_NAME} primarily operates as a frontend application that interacts with APIs and local storage (IndexedDB).

*   **Local Storage (Not Cookies):** We use IndexedDB, which is a browser-based storage mechanism, to store your search history and cached search results. This is not a traditional cookie but serves a similar purpose of retaining data on your device for improved user experience (e.g., faster loading of previously searched items, offline access). This data is stored locally on your device and is not used for tracking across other websites.
*   **Third-Party Services (Gemini API):** When you perform a search, your query is sent to the Google Gemini API. Google may use cookies or similar technologies as part of their service. We do not control these. Please refer to Google's Cookie Policy and Privacy Policy for more information on their practices.
*   **Necessary Technologies (e.g. TailwindCDN):** The tools used to build and style this application (like Tailwind CSS via CDN) might set their own cookies or use local storage for their functionality. These are typically essential for the visual presentation or operation of the development environment.

**How to Control Cookies**

Most web browsers allow some control of most cookies through the browser settings. To find out more about cookies, including how to see what cookies have been set and how to manage and delete them, visit www.aboutcookies.org or www.allaboutcookies.org.

Please note that if you choose to disable cookies or similar technologies, some features of the Application or related services (like the Gemini API) might not operate as intended.

**Changes to This Cookie Policy**

We may update this Cookie Policy from time to time. We will notify you of any changes by posting the new Cookie Policy within the Application.

**Contact Us**

If you have any questions about this Cookie Policy, please understand this is a sample application and not a commercial product.
`;

const COPYRIGHT_INFO_TITLE = "Copyright Information";
const COPYRIGHT_INFO_CONTENT = `
# Copyright Information for ${APP_NAME}

Last updated: ${LAST_UPDATED_DATE}

**Application Copyright:**

The application code, user interface design, and overall structure of ${APP_NAME} are copyrighted &copy; ${getCurrentYear()} ${APP_NAME}. All rights reserved.

This application is provided as a sample and for demonstration purposes only. It is not intended for commercial use.

**Content and Data:**

*   **Lyrics and Artist Information:** All lyrics, artist information, song descriptions, and related metadata are retrieved through the Google Gemini API. The copyright for this content belongs to the respective artists, songwriters, publishers, and/or other rights holders. Google's terms of service apply to the use of this data.
*   **Google Gemini API:** The use of the Google Gemini API is subject to Google's Terms of Service and Privacy Policy. Gemini is a trademark of Google LLC.
*   **Third-Party Libraries:** This application may use open-source libraries and components. Their respective licenses apply.

**Disclaimer:**

This application is for personal, non-commercial use. The accuracy and availability of lyrics and other information are dependent on the Google Gemini API and its sources. We make no warranties regarding the completeness, accuracy, or reliability of the information provided.

**Contact:**

For inquiries related to the application itself (excluding third-party content), please note this is a sample application and not intended for production or commercial distribution.
`;


const Footer: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalContent, setModalContent] = useState('');

  const openModal = (title: string, content: string) => {
    setModalTitle(title);
    setModalContent(content);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  return (
    <>
      <footer className="bg-muted/30 border-t border-border text-center p-3 text-xs text-muted-foreground flex-shrink-0">
        <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
          <p className="text-center sm:text-left">
            Copyright &copy; {getCurrentYear()} {APP_NAME}. All rights reserved.
          </p>
          <nav className="flex flex-wrap justify-center items-center space-x-1.5 sm:space-x-3">
            <button 
              onClick={() => openModal(PRIVACY_POLICY_TITLE, PRIVACY_POLICY_CONTENT)} 
              className="hover:text-primary transition-colors px-1 py-0.5 sm:px-1.5 sm:py-1 rounded-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              aria-label="View Privacy Policy"
            >
              Privacy Policy
            </button>
            <span className="select-none">&bull;</span>
            <button 
              onClick={() => openModal(COOKIE_POLICY_TITLE, COOKIE_POLICY_CONTENT)} 
              className="hover:text-primary transition-colors px-1 py-0.5 sm:px-1.5 sm:py-1 rounded-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              aria-label="View Cookie Policy"
            >
              Cookie Policy
            </button>
            <span className="select-none">&bull;</span>
            <button 
              onClick={() => openModal(COPYRIGHT_INFO_TITLE, COPYRIGHT_INFO_CONTENT)} 
              className="hover:text-primary transition-colors px-1 py-0.5 sm:px-1.5 sm:py-1 rounded-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              aria-label="View Copyright Information"
            >
              Copyright
            </button>
          </nav>
        </div>
      </footer>
      <Modal isOpen={modalOpen} onClose={closeModal} title={modalTitle}>
        <MarkdownRenderer 
          markdownContent={modalContent} 
          className="prose-sm prose-p:leading-relaxed prose-headings:mb-3 prose-headings:mt-5 prose-ul:my-3 prose-ol:my-3" 
        />
      </Modal>
    </>
  );
};

export default Footer;