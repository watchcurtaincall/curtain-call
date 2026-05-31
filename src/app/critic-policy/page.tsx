import React from 'react';
import Link from 'next/link';
import { Shield, BookOpen, PenTool, CheckCircle } from 'lucide-react';

export const metadata = {
  title: 'Critic Verification Policy | Curtain Call',
  description: 'Guidelines and requirements for becoming a Verified Critic on Curtain Call.',
};

export default function CriticPolicyPage() {
  return (
    <div className="min-h-screen bg-cc-light pb-24">
      {/* Hero Section */}
      <div className="bg-cc-red text-white py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-8 h-8 text-cc-gold" />
            <span className="text-cc-gold font-bold tracking-wider uppercase text-sm">Editorial Standards</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-6 leading-tight">
            Verified Critic Policy & Guidelines
          </h1>
          <p className="text-xl md:text-2xl font-serif text-gray-200 leading-relaxed max-w-3xl">
            Curtain Call maintains a rigorous standard for theatrical criticism. Here is what it takes to join our roster of Verified Critics.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 -mt-8 relative z-10">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8 md:p-12">
          
          <div className="prose prose-lg max-w-none prose-headings:font-serif prose-headings:text-cc-black prose-a:text-cc-red hover:prose-a:text-cc-red-dark">
            
            <p className="text-xl text-gray-600 font-serif leading-relaxed mb-10 border-b pb-10">
              The Curtain Call Chronicle aims to elevate the discourse surrounding Nigerian theatre. We believe that robust, analytical, and fair criticism is essential for the growth of the industry. To ensure the quality and credibility of our reviews, we have established a Verified Critic program.
            </p>

            <h2 className="text-2xl font-bold mb-6 mt-12 flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-cc-red" />
              Requirements for Verification
            </h2>
            <p className="mb-6">
              To be considered for Verified Critic status on Curtain Call, applicants must demonstrate a proven track record of theatrical critique. Our curation board looks for the following:
            </p>
            <ul className="space-y-4 mb-10 bg-gray-50 p-6 md:p-8 rounded-lg border border-gray-100">
              <li className="flex gap-4">
                <div className="mt-1 bg-white p-1 rounded-full shadow-sm">
                  <BookOpen className="w-5 h-5 text-cc-red" />
                </div>
                <div>
                  <strong className="block text-cc-black">Published Portfolio</strong>
                  <span className="text-gray-600">Applicants must provide links to at least three (3) previously published theatrical reviews. These can be from reputable blogs, newspapers, literary magazines, or established substacks.</span>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="mt-1 bg-white p-1 rounded-full shadow-sm">
                  <PenTool className="w-5 h-5 text-cc-red" />
                </div>
                <div>
                  <strong className="block text-cc-black">Analytical Rigor</strong>
                  <span className="text-gray-600">We look for reviews that go beyond plot summaries. A qualified critic should demonstrate an understanding of stagecraft, dramaturgy, direction, acting choices, and technical design.</span>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="mt-1 bg-white p-1 rounded-full shadow-sm">
                  <Shield className="w-5 h-5 text-cc-red" />
                </div>
                <div>
                  <strong className="block text-cc-black">Ethical Integrity</strong>
                  <span className="text-gray-600">Critics must maintain independence and disclose any conflicts of interest regarding productions they review.</span>
                </div>
              </li>
            </ul>

            <h2 className="text-2xl font-bold mb-6 mt-12">The Review Process</h2>
            <p>
              Once you submit your application through your dashboard, our Curation Board will review your portfolio within 5-7 business days. 
            </p>
            <p>
              <strong>If approved:</strong> You will receive a Verified Badge on your profile, and your reviews will be prominently featured on production pages and the Chronicle homepage. You will also be eligible for commissioned reviews.
            </p>
            <p>
              <strong>If rejected:</strong> We will provide specific feedback on why your application was not successful. Common reasons include submitting poetry/fiction instead of theatrical criticism, or lacking a sufficient history of published work. You are welcome to refine your portfolio and reapply after three months.
            </p>

            <h2 className="text-2xl font-bold mb-6 mt-12">Maintaining Verification</h2>
            <p>
              Verified status is a privilege, not a lifetime appointment. To maintain your badge, you must:
            </p>
            <ul>
              <li>Publish at least one review every six months on Curtain Call.</li>
              <li>Adhere to our Community Guidelines and Anti-Harassment Policy.</li>
              <li>Refrain from publishing reviews of productions where you served as cast or crew.</li>
            </ul>

            <div className="mt-16 pt-8 border-t border-gray-200">
              <div className="bg-cc-red/5 border border-cc-red/20 rounded-xl p-8 text-center">
                <h3 className="text-xl font-serif font-bold text-cc-black mb-4">Ready to join the Chronicle?</h3>
                <p className="text-gray-600 mb-6">If you meet the criteria outlined above, we would love to review your application.</p>
                <Link href="/critics/apply" className="inline-flex items-center justify-center px-8 py-3 bg-cc-red text-white font-medium rounded-lg hover:bg-cc-red-dark transition-colors">
                  Apply for Verification
                </Link>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
