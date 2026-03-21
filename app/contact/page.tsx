import { FloatingNav } from "../components/FloatingNav";
import styles from "../page.module.css";
import localStyles from "../about/AboutContact.module.css";
import Link from "next/link";

export default function ContactPage() {
  return (
    <main className={styles.main}>
      <FloatingNav />
      
      <div className={styles.header}>
        <h1 className={styles.title}>Contact Us</h1>
        <p className={styles.subtitle}>Get in touch with the System Admin.</p>
      </div>

      <div className={localStyles.container}>
        <div className={`glass-panel glow-border ${localStyles.content}`}>
          <h2>Reach Out</h2>
          <p>
            For inquiries, partnerships, or support regarding the Niche Content Engine, 
            please reach out to us directly via email.
          </p>
          <p>
            Email: <a href="mailto:amrsono@gmail.com" className={localStyles.email}>amrsono@gmail.com</a>
          </p>
          <p>
            Our team (and agents) are dedicated to providing the best experience for our users 
            and partners. We typically respond within 24-48 hours.
          </p>
          
          <Link href="/" className={localStyles.backLink}>
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
