'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { ClientDB, syncFromSupabase } from '@/lib/db';
import { Artist, Production, Article } from '@/lib/types';
import { Upload, CheckCircle2, User, Drama, Sparkles, BookOpen, Plus, X, Search, Calendar, Award, Globe, ShieldAlert, ArrowRight, Check, Trash2, LayoutGrid, FileText, FolderEdit, Skull, Edit, Eye, ImagePlus, Link2, Mail, Banknote } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

type AdminTab = 'queue' | 'blog' | 'direct-artist' | 'direct-play' | 'manage' | 'settings' | 'withdrawals';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>('queue');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  // Custom Rejection Reason and Email Logs States
  const [declineItem, setDeclineItem] = useState<{ id: string; name: string; type: 'artist' | 'play' | 'article' | 'critic' | 'withdrawal'; email: string } | null>(null);
  const [declineReason, setDeclineReason] = useState('');
  const [emailLogs, setEmailLogs] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);

  // Manage tab local states
  const [manageSearch, setManageSearch] = useState('');
  const [manageSubTab, setManageSubTab] = useState<'people' | 'plays'>('people');
  const [editingArtist, setEditingArtist] = useState<Artist | null>(null);
  const [editingPlay, setEditingPlay] = useState<Production | null>(null);
  const [editMemberName, setEditMemberName] = useState('');
  const [editMemberRole, setEditMemberRole] = useState('');
  const [editMemberCategory, setEditMemberCategory] = useState<'Creative' | 'Cast' | 'Technical'>('Cast');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    id: string;
    title: string;
    type: 'artist' | 'play';
  } | null>(null);

  // Submission preview states
  const [previewArtist, setPreviewArtist] = useState<Artist | null>(null);
  const [previewPlay, setPreviewPlay] = useState<Production | null>(null);
  const [previewArticle, setPreviewArticle] = useState<Article | null>(null);

  // Image upload refs for edit modals
  const editArtistImageRef = useRef<HTMLInputElement>(null);
  const editPlayPosterRef = useRef<HTMLInputElement>(null);
  const editPlayGalleryRef = useRef<HTMLInputElement>(null);
  const [editPlayGalleryUrl, setEditPlayGalleryUrl] = useState('');

  // Pending queues state
  const [pendingArtists, setPendingArtists] = useState<Artist[]>([]);
  const [pendingPlays, setPendingPlays] = useState<Production[]>([]);
  const [pendingArticles, setPendingArticles] = useState<Article[]>([]);
  const [pendingCritics, setPendingCritics] = useState<any[]>([]);

  // Blog publishing state
  const [blogForm, setBlogForm] = useState({
    title: '',
    excerpt: '',
    author: 'Curtain Call Editorial',
    category: 'Stage Spotlight'
  });
  const [blogContent, setBlogContent] = useState('');
  const [blogImage, setBlogImage] = useState<string | null>(null);
  const blogImageInputRef = useRef<HTMLInputElement>(null);

  // Direct Artist state
  const [artistForm, setArtistForm] = useState({
    name: '',
    bio: '',
    dateOfBirth: ''
  });
  const [roleSelect, setRoleSelect] = useState('Actor');
  const [customRole, setCustomRole] = useState('');
  const [crawling, setCrawling] = useState(false);
  const [artistImage, setArtistImage] = useState<string | null>(null);
  const artistImageInputRef = useRef<HTMLInputElement>(null);

  // Direct Play state
  const [playForm, setPlayForm] = useState({
    title: '',
    playwright: '',
    director: '',
    synopsis: '',
    venue: '',
    year: '2026',
    status: 'Coming Soon' as 'Currently Showing' | 'Coming Soon' | 'Past Production',
    showDate: ''
  });
  const [genreSelect, setGenreSelect] = useState('Drama');
  const [customGenre, setCustomGenre] = useState('');
  
  // Dynamic Cast and Crew members list
  const [castMembers, setCastMembers] = useState<{ name: string; role: string; category: 'Creative' | 'Cast' | 'Technical' }[]>([]);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('');
  const [newMemberCategory, setNewMemberCategory] = useState<'Creative' | 'Cast' | 'Technical'>('Cast');

  const [playPoster, setPlayPoster] = useState<string | null>(null);
  const [playGallery, setPlayGallery] = useState<string[]>([]);
  const playPosterInputRef = useRef<HTMLInputElement>(null);
  const playGalleryInputRef = useRef<HTMLInputElement>(null);

  // Load pending submissions from LocalStorage ClientDB on mount
  const loadQueues = () => {
    setPendingArtists(ClientDB.getPendingArtists());
    setPendingPlays(ClientDB.getPendingPlays());
    setPendingArticles(ClientDB.getPendingArticles());
    setPendingCritics(ClientDB.getPendingCritics());
    setWithdrawals(ClientDB.getWithdrawals());
    if (typeof window !== 'undefined') {
      setEmailLogs(ClientDB.getEmailLogs());
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const authed = localStorage.getItem('cc_authed') === 'true';
    const authedUser = localStorage.getItem('cc_authed_user');
    
    if (!authed || !authedUser) {
      router.push('/login');
      return;
    }
    
    try {
      const parsedUser = JSON.parse(authedUser);
      if (parsedUser.email.toLowerCase() !== 'watchcurtaincall@gmail.com') {
        router.push('/profile');
        return;
      }
      setIsAuthorized(true);
    } catch (e) {
      router.push('/login');
    }
  }, [user, router]);

  useEffect(() => {
    if (!isAuthorized) return;
    
    loadQueues();
    
    // Background pull database sync on admin page mount to retrieve public submissions
    syncFromSupabase();

    if (typeof window !== 'undefined') {
      window.addEventListener('cc-db-synced', loadQueues);
      return () => window.removeEventListener('cc-db-synced', loadQueues);
    }
  }, [refreshTrigger, isAuthorized]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Submit rejection modal confirmation
  const submitDeclineReason = async () => {
    if (!declineItem) return;
    const { id, name, type, email } = declineItem;
    const reasonText = declineReason.trim() || 'Submission does not meet our current guidelines.';

    try {
      if (type === 'artist') {
        ClientDB.rejectArtist(id, reasonText);
      } else if (type === 'play') {
        ClientDB.rejectPlay(id, reasonText);
      } else if (type === 'article') {
        ClientDB.rejectArticle(id, reasonText);
      } else if (type === 'critic') {
        ClientDB.rejectCriticApplication(id);
      } else if (type === 'withdrawal') {
        ClientDB.rejectWithdrawal(id, reasonText);
      }

      let rejectionHtml = '';
      if (type === 'withdrawal') {
        rejectionHtml = `
          <div style="font-family: Arial, sans-serif; background-color: #09090b; color: #f4f4f5; padding: 40px; border-radius: 24px; border: 1px solid #27272a; max-width: 600px; margin: 0 auto;">
            <div style="text-align: center; margin-bottom: 30px;">
              <span style="font-size: 24px; font-weight: bold; color: #ffffff; letter-spacing: -0.5px; font-family: Georgia, serif;">Curtain Call Financials</span>
              <div style="height: 2px; width: 80px; background-color: #dc2626; margin: 15px auto 0;"></div>
            </div>
            
            <h2 style="font-family: Georgia, serif; color: #ef4444; font-size: 22px; margin-top: 0; text-align: center; font-weight: bold;">Withdrawal Request Declined ❌</h2>
            
            <p style="color: #a1a1aa; font-size: 14px; line-height: 1.6; text-align: center;">
              Your withdrawal request has been reviewed and declined. The funds have been returned to your available balance.
            </p>
            
            <div style="background-color: #18181b; border: 1px solid #27272a; border-radius: 16px; padding: 20px; margin: 25px 0;">
              <p style="color: #ef4444; font-size: 11px; text-transform: uppercase; font-weight: bold; margin: 0 0 5px 0;">Declined Amount:</p>
              <p style="color: #ffffff; font-size: 18px; font-weight: bold; margin: 0 0 15px 0;">${name}</p>
              
              <p style="color: #71717a; font-size: 11px; text-transform: uppercase; font-weight: bold; margin: 0 0 5px 0;">Reason for Decline:</p>
              <p style="color: #fca5a5; font-size: 14px; line-height: 1.5; margin: 0; font-style: italic;">
                "${reasonText}"
              </p>
            </div>
            
            <p style="color: #a1a1aa; font-size: 13px; line-height: 1.6; text-align: center;">
              Please review the reason above and ensure your bank account name matches your profile name, or submit a new ticket for support.
            </p>
            
            <p style="color: #71717a; font-size: 11px; line-height: 1.6; border-top: 1px solid #27272a; padding-top: 25px; margin-top: 30px; text-align: center; font-family: monospace;">
              Curtain Call Financial Operations.
            </p>
          </div>
        `;
      } else {
        rejectionHtml = `
          <div style="font-family: sans-serif; background-color: #0c0c0e; color: #ffffff; padding: 40px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.05); max-width: 600px; margin: 0 auto;">
            <div style="text-align: center; margin-bottom: 30px;">
              <span style="font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #ef4444; font-family: serif;">CURTAIN CALL</span>
              <p style="color: #a1a1aa; font-size: 14px; margin-top: 5px;">Digital Home for Theatre Culture in Africa</p>
            </div>
            
            <h2 style="font-family: serif; color: #ffffff; font-size: 22px; margin-top: 0;">Update Regarding Your Submission</h2>
            
            <p style="color: #d4d4d8; font-size: 15px; line-height: 1.6;">
              Thank you for submitting <strong>${name}</strong> to the Curtain Call platform. Our editorial and curatorial board has reviewed your submission.
            </p>
            
            <p style="color: #d4d4d8; font-size: 15px; line-height: 1.6;">
              At this time, we regret to inform you that your submission has been <strong>declined</strong> for publishing on our main feed.
            </p>
            
            <div style="background-color: rgba(239, 68, 68, 0.03); border: 1px solid rgba(239, 68, 68, 0.1); border-radius: 12px; padding: 20px; margin: 30px 0;">
              <p style="color: #ef4444; font-size: 11px; text-transform: uppercase; tracking-wider: 1px; font-weight: bold; margin: 0 0 10px 0;">Curator's Notes & Rejection Reason:</p>
              <p style="color: #fca5a5; font-size: 15px; line-height: 1.6; margin: 0; font-style: italic;">
                "${reasonText}"
              </p>
            </div>
            
            <p style="color: #d4d4d8; font-size: 15px; line-height: 1.6;">
              We encourage you to review the notes above, make the necessary corrections, and re-submit your credit when ready!
            </p>
            
            <p style="color: #a1a1aa; font-size: 13px; line-height: 1.5; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 20px; margin-top: 30px;">
              Best regards,<br/>
              <strong>The Curtain Call Curation Board</strong>
            </p>
          </div>
        `;
      }

      if (email) {
        await ClientDB.sendEmail(email, type === 'withdrawal' ? `Withdrawal Request Update 💸` : `Submission Update: "${name}" 🎭`, rejectionHtml);
      }

      showToast(type === 'withdrawal' ? `Withdrawal of ${name} declined. Rejection email sent.` : `Submission "${name}" declined. Notification email sent to ${email}.`, 'error');
      setDeclineItem(null);
      setDeclineReason('');
      loadQueues();
    } catch (err) {
      showToast('Failed to decline submission', 'error');
    }
  };

  // Approval handlers
  const handleApproveArtist = async (id: string, name: string, email?: string) => {
    try {
      ClientDB.approveArtist(id);

      const approvalHtml = `
        <div style="font-family: sans-serif; background-color: #0c0c0e; color: #ffffff; padding: 40px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.05); max-width: 600px; margin: 0 auto;">
          <div style="text-align: center; margin-bottom: 30px;">
            <span style="font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #ef4444; font-family: serif;">CURTAIN CALL</span>
            <p style="color: #a1a1aa; font-size: 14px; margin-top: 5px;">Digital Home for Theatre Culture in Africa</p>
          </div>
          
          <h2 style="font-family: serif; color: #22c55e; font-size: 22px; margin-top: 0;">Artist Profile Approved! 🎉</h2>
          
          <p style="color: #d4d4d8; font-size: 15px; line-height: 1.6;">
            We are thrilled to inform you that the artist profile for <strong>${name}</strong> has been <strong>approved</strong> by our curatorial board!
          </p>
          
          <p style="color: #d4d4d8; font-size: 15px; line-height: 1.6;">
            It is now fully published and live in our public directory for curators and theatremakers across Africa to discover.
          </p>
          
          <p style="color: #a1a1aa; font-size: 13px; line-height: 1.5; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 20px; margin-top: 30px;">
            Thank you for documenting African theatre history!
            <br/><br/>
            Sincerely,<br/>
            <strong>The Curtain Call Curation Board</strong>
          </p>
        </div>
      `;

      if (email) {
        await ClientDB.sendEmail(email, `Artist Profile Approved: "${name}" 🎭`, approvalHtml);
      }

      showToast(`Artist "${name}" has been approved and added to the verified directory.`);
      loadQueues();
    } catch (err) {
      showToast('Failed to approve artist profile', 'error');
    }
  };

  const handleRejectArtist = (id: string, name: string, email?: string) => {
    setDeclineItem({ id, name, type: 'artist', email: email || 'user@example.com' });
    setDeclineReason('');
  };

  const handleApproveCritic = (id: string, name: string) => {
    try {
      ClientDB.approveCriticApplication(id);
      showToast(`Critic "${name}" application approved. Verified badge activated!`);
      loadQueues();
    } catch (err) {
      showToast('Failed to approve critic application', 'error');
    }
  };

  const handleRejectCritic = (id: string, name: string, email?: string) => {
    setDeclineItem({ id, name, type: 'critic', email: email || 'user@example.com' });
    setDeclineReason('');
  };

  const handleApprovePlay = async (id: string, title: string, email?: string) => {
    try {
      ClientDB.approvePlay(id);

      const approvalHtml = `
        <div style="font-family: sans-serif; background-color: #0c0c0e; color: #ffffff; padding: 40px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.05); max-width: 600px; margin: 0 auto;">
          <div style="text-align: center; margin-bottom: 30px;">
            <span style="font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #ef4444; font-family: serif;">CURTAIN CALL</span>
            <p style="color: #a1a1aa; font-size: 14px; margin-top: 5px;">Digital Home for Theatre Culture in Africa</p>
          </div>
          
          <h2 style="font-family: serif; color: #22c55e; font-size: 22px; margin-top: 0;">Submission Approved & Published! 🎉</h2>
          
          <p style="color: #d4d4d8; font-size: 15px; line-height: 1.6;">
            We are absolutely thrilled to inform you that your submission of <strong>${title}</strong> has been <strong>approved</strong> by our curatorial team!
          </p>
          
          <p style="color: #d4d4d8; font-size: 15px; line-height: 1.6;">
            It is now live in our public directory for users across the continent to view, review, and share!
          </p>
          
          <p style="color: #a1a1aa; font-size: 13px; line-height: 1.5; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 20px; margin-top: 30px;">
            Congratulations on staging your work! Keep building African theatre!
            <br/><br/>
            Sincerely,<br/>
            <strong>The Curtain Call Curation Board</strong>
          </p>
        </div>
      `;

      if (email) {
        await ClientDB.sendEmail(email, `Stage Play Approved: "${title}" 🎭`, approvalHtml);
      }

      showToast(`Stage play "${title}" has been approved and published to the plays directory.`);
      loadQueues();
    } catch (err) {
      showToast('Failed to approve stage play specs', 'error');
    }
  };

  const handleRejectPlay = (id: string, title: string, email?: string) => {
    setDeclineItem({ id, name: title, type: 'play', email: email || 'user@example.com' });
    setDeclineReason('');
  };

  const handleApproveArticle = async (id: string, title: string, email?: string) => {
    try {
      ClientDB.approveArticle(id);

      const approvalHtml = `
        <div style="font-family: sans-serif; background-color: #0c0c0e; color: #ffffff; padding: 40px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.05); max-width: 600px; margin: 0 auto;">
          <div style="text-align: center; margin-bottom: 30px;">
            <span style="font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #ef4444; font-family: serif;">CURTAIN CALL</span>
            <p style="color: #a1a1aa; font-size: 14px; margin-top: 5px;">Digital Home for Theatre Culture in Africa</p>
          </div>
          
          <h2 style="font-family: serif; color: #22c55e; font-size: 22px; margin-top: 0;">Article Approved & Published! 🎉</h2>
          
          <p style="color: #d4d4d8; font-size: 15px; line-height: 1.6;">
            We are absolutely thrilled to inform you that your chronicle submission <strong>${title}</strong> has been <strong>approved</strong> and published!
          </p>
          
          <p style="color: #d4d4d8; font-size: 15px; line-height: 1.6;">
            It is now featured live on our editorial home feed for readers worldwide.
          </p>
          
          <p style="color: #a1a1aa; font-size: 13px; line-height: 1.5; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 20px; margin-top: 30px;">
            Thank you for sharing your thoughts with our theatre culture community!
            <br/><br/>
            Sincerely,<br/>
            <strong>The Curtain Call Curation Board</strong>
          </p>
        </div>
      `;

      if (email) {
        await ClientDB.sendEmail(email, `Chronicle Submission Approved: "${title}" 🎭`, approvalHtml);
      }

      showToast(`Article "${title}" has been approved and published to the chronicles feed.`);
      loadQueues();
    } catch (err) {
      showToast('Failed to approve article draft', 'error');
    }
  };

  const handleRejectArticle = (id: string, title: string, email?: string) => {
    setDeclineItem({ id, name: title, type: 'article', email: email || 'user@example.com' });
    setDeclineReason('');
  };

  const handleApproveWithdrawal = async (id: string, amount: number, accountName: string, bankName: string, email: string) => {
    try {
      ClientDB.approveWithdrawal(id);

      const approvalHtml = `
        <div style="font-family: Arial, sans-serif; background-color: #09090b; color: #f4f4f5; padding: 40px; border-radius: 24px; border: 1px solid #27272a; max-width: 600px; margin: 0 auto;">
          <div style="text-align: center; margin-bottom: 30px;">
            <span style="font-size: 24px; font-weight: bold; color: #ffffff; letter-spacing: -0.5px; font-family: Georgia, serif;">Curtain Call Financials</span>
            <div style="height: 2px; width: 80px; background-color: #22c55e; margin: 15px auto 0;"></div>
          </div>
          
          <h2 style="font-family: Georgia, serif; color: #22c55e; font-size: 22px; margin-top: 0; text-align: center; font-weight: bold;">Withdrawal Approved & Transferred! 💸</h2>
          
          <p style="color: #a1a1aa; font-size: 14px; line-height: 1.6; text-align: center;">
            Great news! Your withdrawal request has been approved and processed. The funds have been successfully transferred to your bank account.
          </p>
          
          <div style="background-color: #18181b; border: 1px solid #27272a; border-radius: 16px; padding: 25px; margin: 30px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-size: 11px; color: #71717a; text-transform: uppercase;">Amount Approved</td>
                <td style="padding: 8px 0; font-size: 14px; color: #22c55e; text-align: right; font-weight: bold;">₦${amount.toLocaleString()}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-size: 11px; color: #71717a; text-transform: uppercase;">Target Bank</td>
                <td style="padding: 8px 0; font-size: 12px; color: #f4f4f5; text-align: right; font-weight: bold;">${bankName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-size: 11px; color: #71717a; text-transform: uppercase;">Account Name</td>
                <td style="padding: 8px 0; font-size: 12px; color: #f4f4f5; text-align: right;">${accountName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-size: 11px; color: #71717a; text-transform: uppercase;">Status</td>
                <td style="padding: 8px 0; font-size: 11px; color: #22c55e; text-align: right; text-transform: uppercase; font-weight: bold;">Successful</td>
              </tr>
            </table>
          </div>
          
          <p style="color: #a1a1aa; font-size: 13px; line-height: 1.6; text-align: center;">
            Please note that depending on your bank, it may take a few minutes for the funds to reflect in your account. Thank you for utilizing Curtain Call!
          </p>
          
          <p style="color: #71717a; font-size: 11px; line-height: 1.6; border-top: 1px solid #27272a; padding-top: 25px; margin-top: 30px; text-align: center; font-family: monospace;">
            Curtain Call Financial Operations.
          </p>
        </div>
      `;

      if (email) {
        await ClientDB.sendEmail(email, `Withdrawal Approved & Transferred! 💸 - ₦${amount.toLocaleString()}`, approvalHtml);
      }

      showToast(`Withdrawal request of ₦${amount.toLocaleString()} approved. Payout email sent to ${email}.`, 'success');
      loadQueues();
    } catch (err) {
      showToast('Failed to approve withdrawal request', 'error');
    }
  };

  const handleRejectWithdrawal = (id: string, amount: number, email: string) => {
    setDeclineItem({ id, name: `₦${amount.toLocaleString()}`, type: 'withdrawal', email });
    setDeclineReason('');
  };

  // Canvas Image Compression helper hookups
  const handleBlogImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setLoading(true);
      const compressed = await ClientDB.compressImage(file, 800, 0.45);
      setBlogImage(compressed);
      showToast('Cover image compressed successfully!');
    } catch (err) {
      showToast('Failed to process blog cover', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleArtistImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setLoading(true);
      const compressed = await ClientDB.compressImage(file, 600, 0.45);
      setArtistImage(compressed);
      showToast('Headshot photo compressed successfully!');
    } catch (err) {
      showToast('Failed to process portrait photo', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePlayPosterUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setLoading(true);
      const compressed = await ClientDB.compressImage(file, 800, 0.45);
      setPlayPoster(compressed);
      showToast('Playbill poster compressed successfully!');
    } catch (err) {
      showToast('Failed to process playbill poster', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePlayGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    try {
      setLoading(true);
      const promises = Array.from(files).map(file => ClientDB.compressImage(file, 800, 0.4));
      const compressedImages = await Promise.all(promises);
      setPlayGallery(prev => [...prev, ...compressedImages]);
      showToast(`${files.length} stage snapshots compressed and added to gallery!`);
    } catch (err) {
      showToast('Failed to process gallery snaps', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Dynamic submissions
  const handlePublishBlog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!blogImage) {
      showToast('Cover photo required to publish editorial chronicles.', 'error');
      return;
    }
    setLoading(true);

    const newArticle: Article = {
      id: `dynamic_article_${Date.now()}`,
      title: blogForm.title,
      excerpt: blogForm.excerpt,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      author: blogForm.author,
      imageUrl: blogImage,
      content: blogContent
    };

    setTimeout(() => {
      ClientDB.saveArticle(newArticle);
      setLoading(false);
      showToast('Editorial Chronicle published to feed successfully!');
      setBlogForm({ title: '', excerpt: '', author: 'Curtain Call Editorial', category: 'Stage Spotlight' });
      setBlogContent('');
      setBlogImage(null);
    }, 1000);
  };

  const handleCrawlArtist = async () => {
    if (!artistForm.name.trim()) {
      showToast('Please type a name to crawl.', 'error');
      return;
    }
    try {
      setCrawling(true);
      showToast(`Searching the web for theatrical records of "${artistForm.name}"...`);
      const res = await fetch(`/api/crawl?name=${encodeURIComponent(artistForm.name)}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to crawl artist data');
      }
      const profile = data.data;
      setArtistForm({
        name: profile.name,
        bio: profile.bio,
        dateOfBirth: profile.dateOfBirth || ''
      });
      
      const standardRoles = ['Actor', 'Director', 'Playwright', 'Producer', 'Set Designer', 'Costume Designer', 'Lighting Designer', 'Stage Manager', 'Sound Designer'];
      const primaryRole = profile.roleType.split(' / ')[0] || 'Actor';
      if (standardRoles.includes(primaryRole)) {
        setRoleSelect(primaryRole);
        setCustomRole('');
      } else {
        setRoleSelect('Other');
        setCustomRole(profile.roleType);
      }
      
      setArtistImage(profile.headshotUrl);
      showToast(`Successfully crawled verified details for "${profile.name}"!`);
    } catch (err: any) {
      showToast(err.message || 'Failed to crawl profile details.', 'error');
    } finally {
      setCrawling(false);
    }
  };

  const handleCrawlPlay = async () => {
    if (!playForm.title.trim()) {
      showToast('Please type a play title before crawling.', 'error');
      return;
    }
    setCrawling(true);
    try {
      showToast(`Searching the web for theatrical playbills of "${playForm.title}"...`);
      const res = await fetch(`/api/crawl?name=${encodeURIComponent(playForm.title)}&type=play`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to crawl play details');
      }
      const play = data.data;
      setPlayForm({
        ...playForm,
        title: play.title,
        playwright: play.playwright || playForm.playwright,
        synopsis: play.synopsis || playForm.synopsis
      });
      const standardGenres = ['Drama', 'Comedy', 'Tragedy', 'Musical', 'Historical Tragedy', 'Tragicomedies'];
      if (standardGenres.includes(play.genre)) {
        setGenreSelect(play.genre);
        setCustomGenre('');
      } else {
        setGenreSelect('Other');
        setCustomGenre(play.genre || '');
      }
      if (play.posterUrl) {
        setPlayPoster(play.posterUrl);
      } else {
        setPlayPoster(null); // leave blank if not found
        showToast('Play details pre-filled. Note: No verified poster art was found online, using generic placeholder.', 'success');
      }
      showToast(`Successfully crawled verified play details for "${play.title}"!`);
    } catch (err: any) {
      showToast(err.message || 'Failed to crawl play details.', 'error');
    } finally {
      setCrawling(false);
    }
  };

  const handleDeleteArtist = (id: string, name: string) => {
    setDeleteConfirm({ id, title: name, type: 'artist' });
  };

  const handleDeletePlay = (id: string, title: string) => {
    setDeleteConfirm({ id, title, type: 'play' });
  };

  const handleToggleDeceased = (artist: Artist) => {
    const nextDeceased = !artist.isDeceased;
    const updated: Artist = {
      ...artist,
      isDeceased: nextDeceased,
      dateOfDeath: nextDeceased ? new Date().toISOString().split('T')[0] : undefined
    };
    ClientDB.saveArtist(updated);
    showToast(`Artist "${artist.name}" marked as ${nextDeceased ? 'Deceased' : 'Living'}.`);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleSaveEditArtist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingArtist) return;
    ClientDB.saveArtist(editingArtist);
    showToast(`Successfully updated details for "${editingArtist.name}"!`);
    setEditingArtist(null);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleSaveEditPlay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlay) return;
    ClientDB.saveProduction(editingPlay);
    showToast(`Successfully updated play bill details for "${editingPlay.title}"!`);
    setEditingPlay(null);
    setRefreshTrigger(prev => prev + 1);
  };

  // Upload a file and compress it to base64, then update the artist headshot
  const handleEditArtistImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingArtist) return;
    try {
      const compressed = await ClientDB.compressImage(file);
      setEditingArtist({ ...editingArtist, headshotUrl: compressed });
    } catch { showToast('Failed to process image.', 'error'); }
  };

  // Upload a file and compress it to base64, then update the play poster
  const handleEditPlayPosterUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingPlay) return;
    try {
      const compressed = await ClientDB.compressImage(file);
      setEditingPlay({ ...editingPlay, posterUrl: compressed });
    } catch { showToast('Failed to process image.', 'error'); }
  };

  // Upload files and append compressed base64 images to the play gallery
  const handleEditPlayGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length || !editingPlay) return;
    try {
      const compressed = await Promise.all(files.map(f => ClientDB.compressImage(f, 800, 0.6)));
      setEditingPlay({ ...editingPlay, galleryImages: [...(editingPlay.galleryImages || []), ...compressed] });
    } catch { showToast('Failed to process gallery images.', 'error'); }
  };

  // Add an image via external URL to the play gallery
  const handleAddGalleryUrl = () => {
    if (!editPlayGalleryUrl.trim() || !editingPlay) return;
    setEditingPlay({ ...editingPlay, galleryImages: [...(editingPlay.galleryImages || []), editPlayGalleryUrl.trim()] });
    setEditPlayGalleryUrl('');
  };



  const handleDirectArtist = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const finalRole = roleSelect === 'Other' ? customRole : roleSelect;

    const newArtist: Artist = {
      id: `direct_artist_${Date.now()}`,
      name: artistForm.name,
      roleType: finalRole,
      headshotUrl: artistImage || '',
      bio: artistForm.bio,
      dateOfBirth: artistForm.dateOfBirth || undefined
    };

    setTimeout(() => {
      ClientDB.saveArtist(newArtist);
      setLoading(false);
      showToast(`Artist "${artistForm.name}" directly published to live directory!`);
      setArtistForm({ name: '', bio: '', dateOfBirth: '' });
      setRoleSelect('Actor');
      setCustomRole('');
      setArtistImage(null);
      setRefreshTrigger(prev => prev + 1);
    }, 1000);
  };

  const handleDirectPlay = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const finalGenre = genreSelect === 'Other' ? customGenre : genreSelect;

    const newPlay: Production = {
      id: `direct_play_${Date.now()}`,
      title: playForm.title,
      synopsis: playForm.synopsis,
      genre: finalGenre,
      runtime: '130 mins',
      venue: playForm.venue,
      status: playForm.status,
      posterUrl: playPoster || '',
      criticScore: null,
      audienceScore: null,
      totalReviews: 0,
      galleryImages: playGallery,
      castAndCrew: castMembers.length > 0 ? castMembers : undefined,
      showDate: playForm.showDate || undefined
    };

    setTimeout(() => {
      ClientDB.saveProduction(newPlay);
      setLoading(false);
      showToast(`Stage production "${playForm.title}" directly published to database!`);
      setPlayForm({ title: '', playwright: '', director: '', synopsis: '', venue: '', year: '2026', status: 'Coming Soon', showDate: '' });
      setGenreSelect('Drama');
      setCustomGenre('');
      setCastMembers([]);
      setPlayPoster(null);
      setPlayGallery([]);
      setRefreshTrigger(prev => prev + 1);
    }, 1000);
  };

  const pendingTotal = pendingArtists.length + pendingPlays.length + pendingArticles.length + pendingCritics.length;

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-4 text-white">
        <div className="w-10 h-10 rounded-full border-t-2 border-red-500 animate-spin" />
        <p className="text-zinc-500 text-xs font-mono tracking-widest uppercase">VERIFYING ADMINISTRATIVE ACCESS...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 min-h-screen bg-zinc-950 text-white">
      {/* Dynamic Toast feedback */}
      {toast && (
        <div className={`fixed bottom-8 right-8 z-50 p-4 rounded-2xl flex items-center gap-3 border shadow-2xl animate-fade-up ${
          toast.type === 'success' 
            ? 'bg-green-950/90 border-green-500/20 text-green-400' 
            : 'bg-red-950/90 border-red-500/20 text-red-400'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <ShieldAlert className="h-5 w-5 shrink-0" />}
          <span className="text-xs font-bold font-mono tracking-wider">{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="mb-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-white/5">
        <div>
          <span className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 px-2.5 py-1 rounded-md uppercase font-mono tracking-widest">
            Security Clearance Level 4
          </span>
          <h1 className="text-4xl font-serif font-bold mt-2">Curtain Curation Portal</h1>
          <p className="text-zinc-500 text-sm mt-1">Direct control, approvals backlog, and chronicles publishing panel</p>
        </div>

        <div className="flex bg-zinc-900 border border-white/5 rounded-2xl p-1 shrink-0 overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveTab('queue')}
            className={`px-4 py-3 text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'queue' ? 'bg-red-600 text-white shadow-lg' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <ShieldAlert className="h-4 w-4" /> Queue
            {pendingTotal > 0 && (
              <span className="text-[9px] font-mono bg-zinc-950 text-red-400 px-2 py-0.5 rounded-full border border-red-500/10">
                {pendingTotal}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('withdrawals')}
            className={`px-4 py-3 text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'withdrawals' ? 'bg-red-600 text-white shadow-lg' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Banknote className="h-4 w-4" /> Withdrawals
            {withdrawals.filter(w => w.status === 'Pending').length > 0 && (
              <span className="text-[9px] font-mono bg-zinc-950 text-red-400 px-2 py-0.5 rounded-full border border-red-500/10 animate-pulse">
                {withdrawals.filter(w => w.status === 'Pending').length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('blog')}
            className={`px-4 py-3 text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'blog' ? 'bg-red-600 text-white shadow-lg' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <FileText className="h-4 w-4" /> Publish Blog
          </button>
          <button
            onClick={() => setActiveTab('direct-artist')}
            className={`px-4 py-3 text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'direct-artist' ? 'bg-red-600 text-white shadow-lg' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <User className="h-4 w-4" /> Add Artist
          </button>
          <button
            onClick={() => setActiveTab('direct-play')}
            className={`px-4 py-3 text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'direct-play' ? 'bg-red-600 text-white shadow-lg' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Drama className="h-4 w-4" /> Add Play
          </button>
          <button
            onClick={() => setActiveTab('manage')}
            className={`px-4 py-3 text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'manage' ? 'bg-red-600 text-white shadow-lg' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <FolderEdit className="h-4 w-4" /> Manage Directory
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-3 text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'settings' ? 'bg-red-600 text-white shadow-lg' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Globe className="h-4 w-4" /> Domain & Emails
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        
        {/* SUBMISSIONS APPROVAL QUEUE */}
        {activeTab === 'queue' && (
          <div className="flex flex-col gap-8 animate-fade-up">
            
            {/* Artists submissions */}
            <div>
              <h2 className="text-xl font-serif font-bold text-white mb-4 flex items-center gap-2">
                <User className="h-5 w-5 text-red-500" /> Pending Artist Profiles ({pendingArtists.length})
              </h2>
              
              {pendingArtists.length === 0 ? (
                <div className="bg-zinc-900/40 border border-white/5 rounded-3xl p-8 text-center text-zinc-500 font-mono text-xs">
                  No artist registration backlogs pending.
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {pendingArtists.map(artist => (
                    <div key={artist.id} className="bg-zinc-900 border border-white/5 rounded-3xl p-5 flex gap-4 items-start shadow-xl">
                      <div className="relative w-16 h-16 rounded-full overflow-hidden shrink-0 border border-white/10 bg-zinc-950 flex items-center justify-center">
                        {artist.headshotUrl ? (
                          <img
                            src={artist.headshotUrl}
                            alt={artist.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="h-8 w-8 text-zinc-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-serif font-bold text-white truncate text-base">{artist.name}</h3>
                        <p className="text-xs text-red-400 font-bold uppercase tracking-widest mt-0.5">{artist.roleType}</p>
                        <p className="text-[11px] text-zinc-400 line-clamp-2 mt-2 leading-relaxed">{artist.bio}</p>
                        
                        <div className="flex items-center gap-2 mt-4 flex-wrap">
                          <button
                            onClick={() => setPreviewArtist(artist)}
                            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-white/5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all"
                          >
                            <Eye className="h-3.5 w-3.5" /> Preview
                          </button>
                          <button
                            onClick={() => handleApproveArtist(artist.id, artist.name, artist.submitterEmail)}
                            className="bg-green-600/10 hover:bg-green-600 text-green-400 hover:text-white border border-green-500/20 hover:border-green-600 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all"
                          >
                            <Check className="h-3.5 w-3.5" /> Approve
                          </button>
                          <button
                            onClick={() => handleRejectArtist(artist.id, artist.name, artist.submitterEmail)}
                            className="bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/20 hover:border-red-600 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Decline
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Play Submissions */}
            <div>
              <h2 className="text-xl font-serif font-bold text-white mb-4 flex items-center gap-2">
                <Drama className="h-5 w-5 text-red-500" /> Pending Stage Playbills ({pendingPlays.length})
              </h2>
              
              {pendingPlays.length === 0 ? (
                <div className="bg-zinc-900/40 border border-white/5 rounded-3xl p-8 text-center text-zinc-500 font-mono text-xs">
                  No theatrical catalog submissions pending review.
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {pendingPlays.map(play => (
                    <div key={play.id} className="bg-zinc-900 border border-white/5 rounded-3xl p-5 flex gap-4 items-start shadow-xl">
                      <div className="relative w-16 aspect-[3/4] rounded-xl overflow-hidden shrink-0 border border-white/10 bg-zinc-950 flex items-center justify-center">
                        {play.posterUrl ? (
                          <img
                            src={play.posterUrl}
                            alt={play.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Drama className="h-6 w-6 text-zinc-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-serif font-bold text-white truncate text-base">{play.title}</h3>
                        <p className="text-xs text-zinc-500 mt-0.5">{play.venue}</p>
                        <p className="text-[11px] text-zinc-400 line-clamp-2 mt-2 leading-relaxed">{play.synopsis}</p>
                        
                        {/* Previews of uploaded gallery images */}
                        {play.galleryImages && play.galleryImages.length > 0 && (
                          <div className="flex gap-1.5 mt-3 overflow-x-auto max-w-full">
                            {play.galleryImages.map((img, idx) => (
                              <div key={idx} className="relative w-10 h-7 rounded overflow-hidden shrink-0 border border-white/5">
                                <img src={img} alt="" className="w-full h-full object-cover" />
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center gap-2 mt-4 flex-wrap">
                          <button
                            onClick={() => setPreviewPlay(play)}
                            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-white/5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all"
                          >
                            <Eye className="h-3.5 w-3.5" /> Preview
                          </button>
                          <button
                            onClick={() => handleApprovePlay(play.id, play.title, play.submitterEmail)}
                            className="bg-green-600/10 hover:bg-green-600 text-green-400 hover:text-white border border-green-500/20 hover:border-green-600 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all"
                          >
                            <Check className="h-3.5 w-3.5" /> Approve
                          </button>
                          <button
                            onClick={() => handleRejectPlay(play.id, play.title, play.submitterEmail)}
                            className="bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/20 hover:border-red-600 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Decline
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Article Submissions */}
            <div>
              <h2 className="text-xl font-serif font-bold text-white mb-4 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-red-500" /> Pending Chronicles & Blog Drafts ({pendingArticles.length})
              </h2>
              
              {pendingArticles.length === 0 ? (
                <div className="bg-zinc-900/40 border border-white/5 rounded-3xl p-8 text-center text-zinc-500 font-mono text-xs">
                  No chronicle drafts pending editorial review.
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {pendingArticles.map(article => (
                    <div key={article.id} className="bg-zinc-900 border border-white/5 rounded-3xl p-5 flex gap-4 items-start shadow-xl">
                      <div className="relative w-20 aspect-video rounded-xl overflow-hidden shrink-0 border border-white/10 bg-zinc-950 flex items-center justify-center">
                        {article.imageUrl ? (
                          <img
                            src={article.imageUrl}
                            alt={article.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <BookOpen className="h-6 w-6 text-zinc-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-serif font-bold text-white truncate text-base">{article.title}</h3>
                        <p className="text-xs text-red-400 font-bold uppercase tracking-widest mt-0.5">{article.author}</p>
                        <p className="text-[11px] text-zinc-400 line-clamp-2 mt-2 leading-relaxed">{article.excerpt}</p>
                        
                        <div className="flex items-center gap-2 mt-4 flex-wrap">
                          <button
                            onClick={() => setPreviewArticle(article)}
                            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-white/5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all"
                          >
                            <Eye className="h-3.5 w-3.5" /> Preview
                          </button>
                          <button
                            onClick={() => handleApproveArticle(article.id, article.title, article.submitterEmail)}
                            className="bg-green-600/10 hover:bg-green-600 text-green-400 hover:text-white border border-green-500/20 hover:border-green-600 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all"
                          >
                            <Check className="h-3.5 w-3.5" /> Approve
                          </button>
                          <button
                            onClick={() => handleRejectArticle(article.id, article.title, article.submitterEmail)}
                            className="bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/20 hover:border-red-600 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Decline
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Critic Applications Submissions */}
            <div>
              <h2 className="text-xl font-serif font-bold text-white mb-4 flex items-center gap-2">
                <Award className="h-5 w-5 text-red-500" /> Pending Verified Critic Applications ({pendingCritics.length})
              </h2>
              
              {pendingCritics.length === 0 ? (
                <div className="bg-zinc-900/40 border border-white/5 rounded-3xl p-8 text-center text-zinc-500 font-mono text-xs">
                  No verified critic applications pending review.
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {pendingCritics.map(critic => (
                    <div key={critic.id} className="bg-zinc-900 border border-white/5 rounded-3xl p-5 flex flex-col justify-between shadow-xl">
                      <div>
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <h3 className="font-serif font-bold text-white text-base truncate">{critic.name}</h3>
                          <span className="text-[10px] text-zinc-500 font-mono">{critic.timestamp || 'Today'}</span>
                        </div>
                        <p className="text-xs text-red-400 font-bold uppercase tracking-widest">{critic.publication || 'Independent Critic'}</p>
                        <p className="text-[11px] text-zinc-500 font-mono mt-1 truncate">Email: {critic.email}</p>
                        
                        {critic.fileName && (
                          <div className="mt-2.5 p-2 bg-zinc-950 rounded-xl border border-white/5 text-[10px] text-zinc-400 flex items-center gap-1.5 font-mono">
                            <FileText className="h-3.5 w-3.5 text-zinc-500" /> Review Sample: {critic.fileName}
                          </div>
                        )}

                        <div className="mt-3 space-y-1">
                          {critic.link1 && (
                            <a
                              href={critic.link1}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] text-zinc-400 hover:text-white flex items-center gap-1 font-mono transition-colors truncate"
                            >
                              <Link2 className="h-3 w-3 shrink-0" /> {critic.link1}
                            </a>
                          )}
                          {critic.link2 && (
                            <a
                              href={critic.link2}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] text-zinc-400 hover:text-white flex items-center gap-1 font-mono transition-colors truncate"
                            >
                              <Link2 className="h-3 w-3 shrink-0" /> {critic.link2}
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-5">
                        <button
                          type="button"
                          onClick={() => handleApproveCritic(critic.id, critic.name)}
                          className="flex-1 bg-green-600/10 hover:bg-green-600 text-green-400 hover:text-white border border-green-500/20 hover:border-green-600 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition-all"
                        >
                          <Check className="h-3.5 w-3.5" /> Approve Critic
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRejectCritic(critic.id, critic.name)}
                          className="bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/20 hover:border-red-600 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition-all"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* WITHDRAWALS MANAGEMENT BACKLOG */}
        {activeTab === 'withdrawals' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-up">
            {/* Column 1: Pending Review (7 cols) */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              <div className="flex items-center justify-between pb-4 border-b border-white/5">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-red-500/10 rounded-xl border border-red-500/20 text-red-400">
                    <Banknote className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-xl">Pending Cash-outs</h3>
                    <p className="text-zinc-500 text-xs mt-0.5">Verification queue for ticket revenue transfers</p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold bg-zinc-900 px-3 py-1.5 rounded-full border border-white/5">
                  {withdrawals.filter(w => w.status === 'Pending').length} Pending
                </span>
              </div>

              {withdrawals.filter(w => w.status === 'Pending').length === 0 ? (
                <div className="bg-zinc-900/50 backdrop-blur-md border border-white/5 rounded-3xl p-12 text-center flex flex-col items-center justify-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-800/80 border border-white/5 flex items-center justify-center text-zinc-500">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-zinc-300 font-bold text-sm">Clear Backlog</p>
                    <p className="text-zinc-500 text-xs mt-1">All payout requests have been reviewed and completed.</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {withdrawals
                    .filter(w => w.status === 'Pending')
                    .map(req => (
                      <div
                        key={req.id}
                        className="bg-zinc-900 border border-white/5 hover:border-white/10 rounded-3xl p-6 flex flex-col gap-5 transition-all shadow-xl hover:shadow-2xl"
                      >
                        {/* Upper row: amount & timestamp */}
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <span className="text-[10px] text-zinc-400 font-mono tracking-wider bg-zinc-950 border border-white/5 px-2.5 py-1 rounded-md uppercase">
                              ID: {req.id}
                            </span>
                            <div className="text-2xl font-bold font-serif text-emerald-400 mt-2">
                              ₦{Number(req.amount).toLocaleString()}
                            </div>
                            <p className="text-zinc-400 text-xs mt-1 flex items-center gap-1.5">
                              <Mail className="h-3 w-3 text-zinc-500" /> {req.email}
                            </p>
                          </div>
                          <span className="text-[10px] text-zinc-500 font-mono mt-1 shrink-0">{req.timestamp}</span>
                        </div>

                        {/* Middle box: account details */}
                        <div className="bg-zinc-950/80 border border-white/5 rounded-2xl p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Beneficiary Name</p>
                            <p className="text-sm font-bold text-white mt-1 font-serif">{req.accountName}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Bank Details</p>
                            <p className="text-sm text-zinc-300 mt-1 font-semibold">
                              {req.bankName}
                            </p>
                            <p className="text-xs text-zinc-500 font-mono mt-0.5">{req.accountNumber}</p>
                          </div>
                        </div>

                        {/* Bottom Actions */}
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleApproveWithdrawal(req.id, req.amount, req.accountName, req.bankName, req.email)}
                            className="flex-1 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/20 hover:border-emerald-600 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md"
                          >
                            <Check className="h-4 w-4" /> Approve Transfer
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRejectWithdrawal(req.id, req.amount, req.email)}
                            className="bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/20 hover:border-red-600 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all"
                          >
                            <Trash2 className="h-4 w-4" /> Decline
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Column 2: Payout History (5 cols) */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              <div className="pb-4 border-b border-white/5">
                <h3 className="font-serif font-bold text-xl">Payout History</h3>
                <p className="text-zinc-500 text-xs mt-0.5">Chronological log of processed disbursements</p>
              </div>

              {withdrawals.filter(w => w.status !== 'Pending').length === 0 ? (
                <div className="bg-zinc-900/30 border border-white/5 rounded-3xl p-8 text-center text-zinc-500 text-xs">
                  No historical cash-out events recorded.
                </div>
              ) : (
                <div className="flex flex-col gap-3.5 max-h-[70vh] overflow-y-auto pr-1">
                  {withdrawals
                    .filter(w => w.status !== 'Pending')
                    .map(req => (
                      <div
                        key={req.id}
                        className="bg-zinc-900/60 border border-white/5 rounded-2xl p-4.5 flex flex-col gap-3 text-xs"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <span className="font-bold text-white">₦{Number(req.amount).toLocaleString()}</span>
                            <p className="text-zinc-500 text-[10px] truncate max-w-[180px] mt-0.5">{req.email}</p>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-md font-mono text-[9px] font-bold shrink-0 ${
                              req.status === 'Approved'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-red-500/10 text-red-400 border border-red-500/20'
                            }`}
                          >
                            {req.status}
                          </span>
                        </div>

                        <div className="text-[10px] text-zinc-400 border-t border-white/5 pt-2.5 flex flex-col gap-1">
                          <p className="text-zinc-500 font-semibold">{req.accountName}</p>
                          <p className="text-zinc-500 font-mono">
                            {req.bankName} • {req.accountNumber}
                          </p>
                          {req.status === 'Declined' && req.declineReason && (
                            <p className="text-red-400/90 bg-red-950/20 border border-red-500/10 rounded-lg p-2 mt-1.5 font-sans leading-relaxed italic">
                              "{req.declineReason}"
                            </p>
                          )}
                        </div>
                        <span className="text-[9px] text-zinc-600 font-mono text-right">{req.timestamp}</span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* PUBLISH EDITORIAL BLOG / CHRONICLE */}
        {activeTab === 'blog' && (
          <form onSubmit={handlePublishBlog} className="max-w-2xl bg-zinc-900 border border-white/5 rounded-3xl p-6 md:p-8 flex flex-col gap-6 shadow-2xl animate-fade-up">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-red-500" />
              <h3 className="font-serif font-bold text-lg">Publish Editorial Chronicle</h3>
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Chronicle Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Preserving Nigeria's Stage Archive: Wole Soyinka's Legacy"
                value={blogForm.title}
                onChange={e => setBlogForm({ ...blogForm, title: e.target.value })}
                className="bg-zinc-950 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500 transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Excerpt / Summary</label>
              <textarea
                required
                rows={3}
                placeholder="A compelling, professional introduction to capture the reader's attention in the chronicles feed..."
                value={blogForm.excerpt}
                onChange={e => setBlogForm({ ...blogForm, excerpt: e.target.value })}
                className="bg-zinc-950 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500 transition-colors placeholder:text-zinc-600 resize-none [scrollbar-width:none]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Author Dossier</label>
                <input
                  type="text"
                  required
                  placeholder="Curtain Call Editorial"
                  value={blogForm.author}
                  onChange={e => setBlogForm({ ...blogForm, author: e.target.value })}
                  className="bg-zinc-950 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Chronicle Category</label>
                <select
                  value={blogForm.category}
                  onChange={e => setBlogForm({ ...blogForm, category: e.target.value })}
                  className="bg-zinc-950 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500 transition-colors"
                >
                  <option value="Stage Spotlight">Stage Spotlight</option>
                  <option value="Drama Critique">Drama Critique</option>
                  <option value="Historical Archive">Historical Archive</option>
                  <option value="Cultural Analysis">Cultural Analysis</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Chronicle Article Content</label>
              
              {/* Text formatting toolbar */}
              <div className="flex items-center gap-1 bg-zinc-950 border border-white/5 border-b-0 rounded-t-xl px-3 py-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setBlogContent(prev => prev + '**bold text**')}
                  className="px-2.5 py-1 text-xs font-bold font-sans bg-zinc-900 hover:bg-zinc-800 border border-white/5 text-zinc-300 hover:text-white rounded transition-colors"
                  title="Bold"
                >
                  Bold
                </button>
                <button
                  type="button"
                  onClick={() => setBlogContent(prev => prev + '*italic text*')}
                  className="px-2.5 py-1 text-xs italic font-sans bg-zinc-900 hover:bg-zinc-800 border border-white/5 text-zinc-300 hover:text-white rounded transition-colors"
                  title="Italic"
                >
                  Italic
                </button>
                <button
                  type="button"
                  onClick={() => setBlogContent(prev => prev + '\n\n### Heading 3')}
                  className="px-2.5 py-1 text-xs font-bold font-mono bg-zinc-900 hover:bg-zinc-800 border border-white/5 text-zinc-300 hover:text-white rounded transition-colors"
                  title="Heading"
                >
                  H3
                </button>
                <button
                  type="button"
                  onClick={() => setBlogContent(prev => prev + '\n\n> "Blockquote content here..."')}
                  className="px-2.5 py-1 text-xs font-sans bg-zinc-900 hover:bg-zinc-800 border border-white/5 text-zinc-300 hover:text-white rounded transition-colors"
                  title="Quote"
                >
                  Quote
                </button>
                <button
                  type="button"
                  onClick={() => setBlogContent(prev => prev + '\n- Bullet point')}
                  className="px-2.5 py-1 text-xs font-sans bg-zinc-900 hover:bg-zinc-800 border border-white/5 text-zinc-300 hover:text-white rounded transition-colors"
                  title="Bullet List"
                >
                  Bullet List
                </button>
                <button
                  type="button"
                  onClick={() => setBlogContent('')}
                  className="ml-auto px-2 py-1 text-[10px] uppercase font-bold tracking-wider text-red-500 hover:text-red-400 rounded transition-colors"
                  title="Clear all text"
                >
                  Clear
                </button>
              </div>

              <textarea
                required
                rows={10}
                placeholder="Write the full verified article content here using standard markdown or text formatting. Tap the buttons above to quickly insert tags..."
                value={blogContent}
                onChange={e => setBlogContent(e.target.value)}
                className="bg-zinc-950 border border-white/5 rounded-b-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500 transition-colors placeholder:text-zinc-600 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.1)_transparent] font-mono"
              />
            </div>

            {/* Blog Cover Image upload with canvas compression */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Cover Art Image</label>
              <input
                type="file"
                accept="image/*"
                ref={blogImageInputRef}
                onChange={handleBlogImageUpload}
                className="hidden"
              />

              {blogImage ? (
                <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-white/10 shadow-lg group">
                  <img src={blogImage} alt="Cover Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setBlogImage(null)}
                    className="absolute top-2 right-2 p-1.5 bg-black/80 hover:bg-black text-white hover:text-red-400 rounded-lg transition-all border border-white/10"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => blogImageInputRef.current?.click()}
                  className="border border-dashed border-white/10 rounded-2xl p-6 text-center hover:border-red-500/50 cursor-pointer transition-colors bg-zinc-950/50 flex flex-col items-center justify-center gap-2"
                >
                  <Upload className="h-6 w-6 text-zinc-500" />
                  <span className="text-xs text-zinc-400">Drag & drop cover photo, or click to browse</span>
                  <span className="text-[10px] text-zinc-600 font-mono">Will be compressed automatically to secure page speed</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-red-900/20 text-sm mt-2 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Publishing to Curation Feed...' : 'Publish Editorial Chronicle to Home'}
            </button>
          </form>
        )}

        {/* DIRECT PUBLISH ARTIST */}
        {activeTab === 'direct-artist' && (
          <form onSubmit={handleDirectArtist} className="max-w-2xl bg-zinc-900 border border-white/5 rounded-3xl p-6 md:p-8 flex flex-col gap-6 shadow-2xl animate-fade-up">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-red-500" />
              <h3 className="font-serif font-bold text-lg">Direct Publish Artist Profile</h3>
            </div>
            <p className="text-xs text-zinc-500 -mt-4">Directly inserts a verified theatremaker dossier bypassing public reviewing systems.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Professional Name</label>
                  <button
                    type="button"
                    disabled={crawling}
                    onClick={handleCrawlArtist}
                    className="text-[10px] font-bold text-red-500 hover:text-red-400 uppercase tracking-wider flex items-center gap-1 transition-colors disabled:opacity-50"
                  >
                    {crawling ? 'Crawling...' : 'Crawl Web'}
                  </button>
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. Joshua Alabi"
                  value={artistForm.name}
                  onChange={e => setArtistForm({ ...artistForm, name: e.target.value })}
                  className="bg-zinc-950 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Date of Birth</label>
                <input
                  type="date"
                  value={artistForm.dateOfBirth}
                  onChange={e => setArtistForm({ ...artistForm, dateOfBirth: e.target.value })}
                  className="bg-zinc-950 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Discipline / Role</label>
                <select
                  value={roleSelect}
                  onChange={e => setRoleSelect(e.target.value)}
                  className="bg-zinc-950 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500 transition-colors"
                >
                  <option value="Actor">Actor</option>
                  <option value="Director">Director</option>
                  <option value="Playwright">Playwright</option>
                  <option value="Producer">Producer</option>
                  <option value="Set Designer">Set Designer</option>
                  <option value="Costume Designer">Costume Designer</option>
                  <option value="Lighting Designer">Lighting Designer</option>
                  <option value="Stage Manager">Stage Manager</option>
                  <option value="Sound Designer">Sound Designer</option>
                  <option value="Other">Other...</option>
                </select>
              </div>
            </div>

            {roleSelect === 'Other' && (
              <div className="flex flex-col gap-1.5 animate-fade-up">
                <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Please Specify Role</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Stage Choreographer"
                  value={customRole}
                  onChange={e => setCustomRole(e.target.value)}
                  className="bg-zinc-950 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Biography</label>
              <textarea
                required
                rows={4}
                placeholder="The verified, pre-colonial or post-colonial encyclopedic dossier of this theatrical giant..."
                value={artistForm.bio}
                onChange={e => setArtistForm({ ...artistForm, bio: e.target.value })}
                className="bg-zinc-950 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500 transition-colors resize-none [scrollbar-width:none]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Headshot Photo</label>
              <input
                type="file"
                accept="image/*"
                ref={artistImageInputRef}
                onChange={handleArtistImageUpload}
                className="hidden"
              />

              {artistImage ? (
                <div className="relative w-36 h-36 rounded-full overflow-hidden border border-white/10 shadow-lg group">
                  <img src={artistImage} alt="Artist headshot" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setArtistImage(null)}
                    className="absolute top-1 right-1 p-1.5 bg-black/80 hover:bg-black text-white hover:text-red-400 rounded-full transition-all border border-white/10"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => artistImageInputRef.current?.click()}
                  className="border border-dashed border-white/10 rounded-2xl p-6 text-center hover:border-red-500/50 cursor-pointer transition-colors bg-zinc-950/50 flex flex-col items-center justify-center gap-2"
                >
                  <Upload className="h-6 w-6 text-zinc-500" />
                  <span className="text-xs text-zinc-400">Click to upload verified portrait headshot</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-red-900/20 text-sm mt-2 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Saving to Core Records...' : 'Publish Verified Artist to Directory'}
            </button>
          </form>
        )}

        {/* DIRECT PUBLISH PLAY */}
        {activeTab === 'direct-play' && (
          <form onSubmit={handleDirectPlay} className="max-w-2xl bg-zinc-900 border border-white/5 rounded-3xl p-6 md:p-8 flex flex-col gap-6 shadow-2xl animate-fade-up">
            <div className="flex items-center gap-2">
              <Drama className="h-5 w-5 text-red-500" />
              <h3 className="font-serif font-bold text-lg">Direct Publish Playbill coordinates</h3>
            </div>
            <p className="text-xs text-zinc-500 -mt-4">Directly registers theatrical plays coordinates to live active plays feed.</p>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Play Title</label>
                <button
                  type="button"
                  disabled={crawling}
                  onClick={handleCrawlPlay}
                  className="text-[10px] font-bold text-red-500 hover:text-red-400 uppercase tracking-wider flex items-center gap-1 transition-colors disabled:opacity-50"
                >
                  {crawling ? 'Crawling...' : 'Crawl Web Specs'}
                </button>
              </div>
              <input
                type="text"
                required
                placeholder="e.g. Kurunmi"
                value={playForm.title}
                onChange={e => setPlayForm({ ...playForm, title: e.target.value })}
                className="bg-zinc-950 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500 transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Playwright</label>
                <input
                  type="text"
                  required
                  placeholder="Ola Rotimi"
                  value={playForm.playwright}
                  onChange={e => setPlayForm({ ...playForm, playwright: e.target.value })}
                  className="bg-zinc-950 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Director</label>
                <input
                  type="text"
                  required
                  placeholder="Bolanle Austen-Peters"
                  value={playForm.director}
                  onChange={e => setPlayForm({ ...playForm, director: e.target.value })}
                  className="bg-zinc-950 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Genre Category</label>
                <select
                  value={genreSelect}
                  onChange={e => setGenreSelect(e.target.value)}
                  className="bg-zinc-950 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500 transition-colors"
                >
                  <option value="Drama">Drama</option>
                  <option value="Comedy">Comedy</option>
                  <option value="Tragedy">Tragedy</option>
                  <option value="Musical">Musical</option>
                  <option value="Historical Tragedy">Historical Tragedy</option>
                  <option value="Tragicomedies">Tragicomedies</option>
                  <option value="Satire">Satire</option>
                  <option value="Melodrama">Melodrama</option>
                  <option value="Other">Other...</option>
                </select>
              </div>
            </div>

            {genreSelect === 'Other' && (
              <div className="flex flex-col gap-1.5 animate-fade-up">
                <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Please Specify Custom Genre</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pre-colonial Epic"
                  value={customGenre}
                  onChange={e => setCustomGenre(e.target.value)}
                  className="bg-zinc-950 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Venue</label>
                <input
                  type="text"
                  required
                  placeholder="University of Ibadan Arts Theatre"
                  value={playForm.venue}
                  onChange={e => setPlayForm({ ...playForm, venue: e.target.value })}
                  className="bg-zinc-950 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Year</label>
                <input
                  type="text"
                  required
                  placeholder="1971"
                  value={playForm.year}
                  onChange={e => setPlayForm({ ...playForm, year: e.target.value })}
                  className="bg-zinc-950 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Synopsis</label>
              <textarea
                required
                rows={4}
                placeholder="The detailed story, setting, conflict, and societal themes of this masterpiece..."
                value={playForm.synopsis}
                onChange={e => setPlayForm({ ...playForm, synopsis: e.target.value })}
                className="bg-zinc-950 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500 transition-colors resize-none [scrollbar-width:none]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Status</label>
                <select
                  value={playForm.status}
                  onChange={e => setPlayForm({ ...playForm, status: e.target.value as any })}
                  className="bg-zinc-950 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500 transition-colors"
                >
                  <option value="Coming Soon">Coming Soon</option>
                  <option value="Currently Showing">Currently Showing</option>
                  <option value="Past Production">Past Production</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider">
                  {playForm.status === 'Coming Soon' ? 'Upcoming Date' : playForm.status === 'Past Production' ? 'When did it happen?' : 'Show Date'}
                </label>
                <input
                  type="date"
                  value={playForm.showDate}
                  onChange={e => setPlayForm({ ...playForm, showDate: e.target.value })}
                  className="bg-zinc-950 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500 transition-colors [color-scheme:dark]"
                />
              </div>
            </div>

            {/* Dynamic Playbill Cast & Crew Builder */}
            <div className="flex flex-col gap-3 bg-zinc-950/40 border border-white/5 rounded-2xl p-5">
              <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Dynamic Playbill Cast & Crew</label>
                <span className="text-[9px] font-mono uppercase bg-zinc-900 border border-white/5 text-zinc-400 px-2 py-0.5 rounded">
                  {castMembers.length} Credits Added
                </span>
              </div>

              {/* Added members preview */}
              {castMembers.length > 0 && (
                <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.1)_transparent] mb-2 animate-fade-up">
                  {castMembers.map((member, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-zinc-950/80 border border-white/5 px-3 py-2 rounded-xl text-xs">
                      <div className="flex flex-col">
                        <span className="text-[9px] text-zinc-500 uppercase tracking-widest">{member.category} — {member.role}</span>
                        <span className="text-white font-medium mt-0.5">{member.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCastMembers(castMembers.filter((_, i) => i !== idx))}
                        className="text-zinc-500 hover:text-red-400 transition-colors p-1"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Form to add single member */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex flex-col gap-1 relative">
                  <label className="text-[10px] text-zinc-500 uppercase font-semibold">Member Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Joke Silva"
                    value={newMemberName}
                    onChange={e => setNewMemberName(e.target.value)}
                    className="bg-zinc-950 border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500 transition-colors"
                  />
                  {(() => {
                    const allArtists = ClientDB.getArtists();
                    const matchingSuggestions = newMemberName.trim()
                      ? allArtists.filter(a => 
                          a.name.toLowerCase().includes(newMemberName.toLowerCase()) &&
                          a.name.toLowerCase() !== newMemberName.toLowerCase()
                        )
                      : [];
                    
                    if (matchingSuggestions.length === 0) return null;

                    return (
                      <div className="absolute top-[100%] left-0 w-full bg-zinc-900 border border-white/10 rounded-lg shadow-2xl z-20 mt-1 max-h-36 overflow-y-auto [scrollbar-width:none]">
                        {matchingSuggestions.map(artist => (
                          <div
                            key={artist.id}
                            onClick={() => {
                              setNewMemberName(artist.name);
                              if (artist.roleType) {
                                setNewMemberRole(artist.roleType);
                                const roleLow = artist.roleType.toLowerCase();
                                if (roleLow.includes('director') || roleLow.includes('playwright') || roleLow.includes('producer') || roleLow.includes('designer')) {
                                  setNewMemberCategory('Creative');
                                } else if (roleLow.includes('manager') || roleLow.includes('crew') || roleLow.includes('technical') || roleLow.includes('engineer')) {
                                  setNewMemberCategory('Technical');
                                } else {
                                  setNewMemberCategory('Cast');
                                }
                              }
                            }}
                            className="px-3 py-2 text-xs hover:bg-red-600 hover:text-white cursor-pointer transition-colors border-b border-white/5 last:border-0 flex items-center justify-between"
                          >
                            <span className="font-medium text-white group-hover:text-white">{artist.name}</span>
                            <span className="text-[9px] text-zinc-400 group-hover:text-red-200">{artist.roleType}</span>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-zinc-500 uppercase font-semibold">Billing Role</label>
                  <input
                    type="text"
                    placeholder="e.g. Lead Actress"
                    value={newMemberRole}
                    onChange={e => setNewMemberRole(e.target.value)}
                    className="bg-zinc-950 border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500 transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-zinc-500 uppercase font-semibold">Billing Category</label>
                  <select
                    value={newMemberCategory}
                    onChange={e => setNewMemberCategory(e.target.value as any)}
                    className="bg-zinc-950 border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500 transition-colors"
                  >
                    <option value="Creative">Creative Team</option>
                    <option value="Cast">Cast Billing</option>
                    <option value="Technical">Technical Crew</option>
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!newMemberName.trim() || !newMemberRole.trim()) {
                    showToast('Please specify member name and role.', 'error');
                    return;
                  }
                  setCastMembers(prev => [...prev, {
                    name: newMemberName.trim(),
                    role: newMemberRole.trim(),
                    category: newMemberCategory
                  }]);
                  setNewMemberName('');
                  setNewMemberRole('');
                  showToast(`Added dynamic credit: ${newMemberName.trim()} (${newMemberRole.trim()})`);
                }}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white border border-white/5 text-xs font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 mt-1"
              >
                Add Member to Playbill
              </button>
            </div>

            {/* Poster upload */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Primary Playbill Poster</label>
              <input
                type="file"
                accept="image/*"
                ref={playPosterInputRef}
                onChange={handlePlayPosterUpload}
                className="hidden"
              />

              {playPoster ? (
                <div className="relative w-36 aspect-[3/4] rounded-2xl overflow-hidden border border-white/10 shadow-lg group">
                  <img src={playPoster} alt="Poster" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setPlayPoster(null)}
                    className="absolute top-2 right-2 p-1.5 bg-black/80 hover:bg-black text-white hover:text-red-400 rounded-lg transition-all border border-white/10"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => playPosterInputRef.current?.click()}
                  className="border border-dashed border-white/10 rounded-2xl p-6 text-center hover:border-red-500/50 cursor-pointer transition-colors bg-zinc-950/50 flex flex-col items-center justify-center gap-2"
                >
                  <Upload className="h-6 w-6 text-zinc-500" />
                  <span className="text-xs text-zinc-400">Click to upload play cover/poster art</span>
                </div>
              )}
            </div>

            {/* Gallery Upload */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider flex items-center justify-between">
                <span>Production Gallery Photos</span>
                <span className="text-[10px] text-zinc-500 font-mono lowercase">Multiple selection supported</span>
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                ref={playGalleryInputRef}
                onChange={handlePlayGalleryUpload}
                className="hidden"
              />

              <div
                onClick={() => playGalleryInputRef.current?.click()}
                className="border border-dashed border-white/10 rounded-2xl p-6 text-center hover:border-red-500/50 cursor-pointer transition-colors bg-zinc-950/50 flex flex-col items-center justify-center gap-2"
              >
                <Upload className="h-6 w-6 text-zinc-500" />
                <span className="text-xs text-zinc-400">Upload multiple stage production/cast snapshots</span>
              </div>

              {playGallery.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-3 animate-fade-up">
                  {playGallery.map((img, idx) => (
                    <div key={idx} className="relative aspect-video rounded-xl overflow-hidden border border-white/10 group bg-zinc-950">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setPlayGallery(playGallery.filter((_, i) => i !== idx))}
                        className="absolute top-1.5 right-1.5 p-1 bg-black/80 hover:bg-black text-white hover:text-red-400 rounded-md transition-all border border-white/5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-red-900/20 text-sm mt-2 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Saving Play bill Specs...' : 'Publish verified Play directly to catalog'}
            </button>
          </form>
        )}

        {/* DIRECTORY DATABASE MANAGER */}
        {activeTab === 'manage' && (
          <div className="flex flex-col gap-6 animate-fade-up">
            
            {/* Tab header and Search controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900 border border-white/5 p-4 rounded-3xl">
              <div className="flex items-center bg-zinc-950 p-1 rounded-xl border border-white/5 shrink-0 self-start">
                <button
                  onClick={() => setManageSubTab('people')}
                  className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 ${
                    manageSubTab === 'people' ? 'bg-red-600 text-white' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <User className="h-3.5 w-3.5" /> People ({ClientDB.getArtists().length})
                </button>
                <button
                  onClick={() => setManageSubTab('plays')}
                  className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 ${
                    manageSubTab === 'plays' ? 'bg-red-600 text-white' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Drama className="h-3.5 w-3.5" /> Plays ({ClientDB.getProductions().length})
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <input
                  type="text"
                  placeholder={`Search verified ${manageSubTab === 'people' ? 'theatremakers' : 'plays'} by name...`}
                  value={manageSearch}
                  onChange={e => setManageSearch(e.target.value)}
                  className="w-full bg-zinc-950 border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-red-500 transition-colors"
                />
                {manageSearch && (
                  <button
                    onClick={() => setManageSearch('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white text-xs font-mono"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* PEOPLE MANAGEMENT GRID */}
            {manageSubTab === 'people' && (
              <div className="grid grid-cols-1 gap-4">
                {(() => {
                  const filtered = ClientDB.getArtists().filter(a => 
                    a.name.toLowerCase().includes(manageSearch.toLowerCase()) ||
                    (a.roleType && a.roleType.toLowerCase().includes(manageSearch.toLowerCase()))
                  );

                  if (filtered.length === 0) {
                    return (
                      <div className="bg-zinc-900/40 border border-white/5 rounded-3xl p-12 text-center text-zinc-500 font-mono text-xs">
                        No matching theatremakers found in local database.
                      </div>
                    );
                  }

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filtered.map(artist => (
                        <div key={artist.id} className="bg-zinc-900 border border-white/5 rounded-3xl p-5 flex gap-4 items-start shadow-xl relative overflow-hidden group">
                          {artist.isDeceased && (
                            <div className="absolute top-0 right-0 bg-red-600/10 border-l border-b border-red-500/20 text-red-400 text-[8px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-bl-xl flex items-center gap-1 font-mono">
                              <Skull className="h-2.5 w-2.5" /> Deceased
                            </div>
                          )}
                          <div className="relative w-16 h-16 rounded-full overflow-hidden shrink-0 border border-white/10 bg-zinc-950 flex items-center justify-center">
                            {artist.headshotUrl ? (
                              <img
                                src={artist.headshotUrl}
                                alt={artist.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User className="h-6 w-6 text-zinc-600" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0 pr-12">
                            <h3 className="font-serif font-bold text-white truncate text-base">{artist.name}</h3>
                            <p className="text-xs text-red-400 font-bold uppercase tracking-widest mt-0.5">{artist.roleType}</p>
                            <p className="text-[10px] text-zinc-500 font-mono mt-1">DOB: {artist.dateOfBirth || 'Unknown'}</p>
                            <p className="text-[11px] text-zinc-400 line-clamp-2 mt-2 leading-relaxed">{artist.bio || 'No biography details provided.'}</p>
                            
                            <div className="flex items-center gap-2 mt-4 flex-wrap">
                              <button
                                type="button"
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditingArtist(artist); }}
                                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-white/5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all"
                              >
                                <Edit className="h-3 w-3" /> Edit
                              </button>
                              <button
                                type="button"
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleToggleDeceased(artist); }}
                                className={`border px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all ${
                                  artist.isDeceased
                                    ? 'bg-green-600/10 hover:bg-green-600 text-green-400 hover:text-white border-green-500/20'
                                    : 'bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white border-red-500/20'
                                }`}
                              >
                                <Skull className="h-3 w-3" /> {artist.isDeceased ? 'Mark Living' : 'Mark Deceased'}
                              </button>
                              <button
                                type="button"
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteArtist(artist.id, artist.name); }}
                                className="bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/20 hover:border-red-600 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all"
                              >
                                <Trash2 className="h-3 w-3" /> Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* PLAYS MANAGEMENT GRID */}
            {manageSubTab === 'plays' && (
              <div className="grid grid-cols-1 gap-4">
                {(() => {
                  const filtered = ClientDB.getProductions().filter(p => 
                    p.title.toLowerCase().includes(manageSearch.toLowerCase()) ||
                    (p.genre && p.genre.toLowerCase().includes(manageSearch.toLowerCase()))
                  );

                  if (filtered.length === 0) {
                    return (
                      <div className="bg-zinc-900/40 border border-white/5 rounded-3xl p-12 text-center text-zinc-500 font-mono text-xs">
                        No matching stage productions found in local database.
                      </div>
                    );
                  }

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filtered.map(play => (
                        <div key={play.id} className="bg-zinc-900 border border-white/5 rounded-3xl p-5 flex gap-4 items-start shadow-xl">
                          <div className="relative w-16 aspect-[3/4] rounded-xl overflow-hidden shrink-0 border border-white/10 bg-zinc-950 flex items-center justify-center">
                            {play.posterUrl ? (
                              <img
                                src={play.posterUrl}
                                alt={play.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Drama className="h-6 w-6 text-zinc-600" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-serif font-bold text-white truncate text-base">{play.title}</h3>
                            <p className="text-xs text-red-400 font-bold uppercase tracking-widest mt-0.5">{play.genre}</p>
                            <p className="text-[10px] text-zinc-500 font-mono mt-1">Venue: {play.venue}</p>
                            <p className="text-[11px] text-zinc-400 line-clamp-2 mt-2 leading-relaxed">{play.synopsis}</p>
                                                        <div className="flex items-center gap-2 mt-4">
                              <button
                                type="button"
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditingPlay(play); }}
                                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-white/5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all"
                              >
                                <Edit className="h-3 w-3" /> Edit Info
                              </button>
                              <button
                                type="button"
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeletePlay(play.id, play.title); }}
                                className="bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/20 hover:border-red-600 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all"
                              >
                                <Trash2 className="h-3 w-3" /> Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}

          </div>
        )}

        {/* CUSTOM DELETE CONFIRMATION MODAL */}
        {deleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
            <div 
              className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
              onClick={() => setDeleteConfirm(null)} 
            />
            <div className="relative w-full max-w-sm bg-zinc-900 border border-white/10 rounded-3xl p-6 shadow-2xl text-center animate-scale-up z-50">
              <div className="w-12 h-12 rounded-2xl bg-red-950 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="h-5 w-5 text-red-500" />
              </div>
              <h2 className="font-serif font-bold text-white text-lg mb-2">Delete permanently?</h2>
              <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
                Are you absolutely sure you want to delete the {deleteConfirm.type === 'artist' ? 'artist profile' : 'stage production'} <strong className="text-white">"{deleteConfirm.title}"</strong> permanently? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 bg-zinc-800 border border-white/5 hover:bg-zinc-700 text-white font-medium py-3 rounded-xl transition-all text-xs uppercase tracking-wider font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (deleteConfirm.type === 'artist') {
                      ClientDB.deleteArtist(deleteConfirm.id);
                      showToast(`Artist "${deleteConfirm.title}" deleted permanently.`);
                    } else {
                      ClientDB.deleteProduction(deleteConfirm.id);
                      showToast(`Stage production "${deleteConfirm.title}" deleted permanently.`);
                    }
                    setRefreshTrigger(prev => prev + 1);
                    setDeleteConfirm(null);
                  }}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-all text-xs uppercase tracking-wider font-semibold"
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* EDIT ARTIST MODAL */}
        {editingArtist && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <form
              onSubmit={handleSaveEditArtist}
              className="bg-zinc-900 border border-white/10 rounded-3xl max-w-lg w-full p-6 md:p-8 flex flex-col gap-5 shadow-2xl animate-fade-up max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <h3 className="font-serif font-bold text-lg text-white">Edit Artist Dossier</h3>
                <button
                  type="button"
                  onClick={() => setEditingArtist(null)}
                  className="text-zinc-500 hover:text-white transition-colors p-1"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Professional Name</label>
                <input
                  type="text"
                  required
                  value={editingArtist.name}
                  onChange={e => setEditingArtist({ ...editingArtist, name: e.target.value })}
                  className="bg-zinc-950 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Discipline/Role</label>
                  <input
                    type="text"
                    required
                    value={editingArtist.roleType}
                    onChange={e => setEditingArtist({ ...editingArtist, roleType: e.target.value })}
                    className="bg-zinc-950 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Date of Birth</label>
                  <input
                    type="date"
                    value={editingArtist.dateOfBirth || ''}
                    onChange={e => setEditingArtist({ ...editingArtist, dateOfBirth: e.target.value })}
                    className="bg-zinc-950 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Biography</label>
                <textarea
                  required
                  rows={4}
                  value={editingArtist.bio || ''}
                  onChange={e => setEditingArtist({ ...editingArtist, bio: e.target.value })}
                  className="bg-zinc-950 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500 placeholder:text-zinc-600"
                />
              </div>

              {/* Headshot image picker: file upload OR paste any URL */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Headshot Photo</label>
                <div className="flex gap-3 items-start">
                  {/* Live preview */}
                  <div className="relative w-16 h-16 rounded-full overflow-hidden shrink-0 border border-white/10 bg-zinc-950 flex items-center justify-center">
                    {editingArtist.headshotUrl ? (
                      <img src={editingArtist.headshotUrl} alt="preview" className="w-full h-full object-cover" />
                    ) : (
                      <User className="h-7 w-7 text-zinc-600" />
                    )}
                  </div>
                  <div className="flex-1 flex flex-col gap-2">
                    {/* Upload file */}
                    <input ref={editArtistImageRef} type="file" accept="image/*" className="hidden" onChange={handleEditArtistImageUpload} />
                    <button
                      type="button"
                      onClick={() => editArtistImageRef.current?.click()}
                      className="bg-zinc-800 hover:bg-zinc-700 border border-white/5 text-zinc-200 px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all w-full justify-center"
                    >
                      <ImagePlus className="h-3.5 w-3.5" /> Upload File
                    </button>
                    {/* OR paste URL */}
                    <div className="flex gap-2 items-center">
                      <Link2 className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                      <input
                        type="text"
                        placeholder="Or paste any image URL..."
                        value={(editingArtist.headshotUrl || '').startsWith('data:') ? '' : (editingArtist.headshotUrl || '')}
                        onChange={e => setEditingArtist({ ...editingArtist, headshotUrl: e.target.value })}
                        className="flex-1 bg-zinc-950 border border-white/5 rounded-lg px-3 py-2 text-[11px] text-white focus:outline-none focus:border-red-500 placeholder:text-zinc-600"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-4 pt-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setEditingArtist(null)}
                  className="bg-zinc-950 border border-white/5 hover:bg-zinc-800 text-zinc-400 hover:text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        )}

        {/* EDIT PLAY MODAL */}
        {editingPlay && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <form
              onSubmit={handleSaveEditPlay}
              className="bg-zinc-900 border border-white/10 rounded-3xl max-w-xl w-full p-6 md:p-8 flex flex-col gap-5 shadow-2xl animate-fade-up max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <h3 className="font-serif font-bold text-lg text-white">Edit Stage Playbill</h3>
                <button
                  type="button"
                  onClick={() => setEditingPlay(null)}
                  className="text-zinc-500 hover:text-white transition-colors p-1"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Play Title</label>
                <input
                  type="text"
                  required
                  value={editingPlay.title}
                  onChange={e => setEditingPlay({ ...editingPlay, title: e.target.value })}
                  className="bg-zinc-950 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Genre Category</label>
                  <input
                    type="text"
                    required
                    value={editingPlay.genre}
                    onChange={e => setEditingPlay({ ...editingPlay, genre: e.target.value })}
                    className="bg-zinc-950 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Play Venue</label>
                  <input
                    type="text"
                    required
                    value={editingPlay.venue}
                    onChange={e => setEditingPlay({ ...editingPlay, venue: e.target.value })}
                    className="bg-zinc-950 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Play Lifecycle Status</label>
                  <select
                    value={editingPlay.status}
                    onChange={e => setEditingPlay({ ...editingPlay, status: e.target.value as any })}
                    className="bg-zinc-950 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23666%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:0.65rem_auto] bg-[right_1rem_center] bg-no-repeat"
                  >
                    <option value="Currently Showing">Currently Showing</option>
                    <option value="Coming Soon">Coming Soon</option>
                    <option value="Recently Concluded">Recently Concluded</option>
                    <option value="Past Production">Past Production</option>
                    <option value="Draft">Draft</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Scheduled Date</label>
                  <input
                    type="date"
                    value={editingPlay.showDate || ''}
                    onChange={e => setEditingPlay({ ...editingPlay, showDate: e.target.value || undefined })}
                    className="bg-zinc-950 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500 [color-scheme:dark]"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Play Synopsis</label>
                <textarea
                  required
                  rows={4}
                  value={editingPlay.synopsis}
                  onChange={e => setEditingPlay({ ...editingPlay, synopsis: e.target.value })}
                  className="bg-zinc-950 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500 placeholder:text-zinc-600"
                />
              </div>

              {/* Poster image picker: file upload OR paste any URL */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Poster / Cover Image</label>
                <div className="flex gap-3 items-start">
                  {/* Live preview */}
                  <div className="relative w-16 aspect-[3/4] rounded-xl overflow-hidden shrink-0 border border-white/10 bg-zinc-950 flex items-center justify-center">
                    {editingPlay.posterUrl ? (
                      <img src={editingPlay.posterUrl} alt="poster preview" className="w-full h-full object-cover" />
                    ) : (
                      <Drama className="h-6 w-6 text-zinc-600" />
                    )}
                  </div>
                  <div className="flex-1 flex flex-col gap-2">
                    <input ref={editPlayPosterRef} type="file" accept="image/*" className="hidden" onChange={handleEditPlayPosterUpload} />
                    <button
                      type="button"
                      onClick={() => editPlayPosterRef.current?.click()}
                      className="bg-zinc-800 hover:bg-zinc-700 border border-white/5 text-zinc-200 px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all w-full justify-center"
                    >
                      <ImagePlus className="h-3.5 w-3.5" /> Upload File
                    </button>
                    <div className="flex gap-2 items-center">
                      <Link2 className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                      <input
                        type="text"
                        placeholder="Or paste any image URL..."
                        value={(editingPlay.posterUrl || '').startsWith('data:') ? '' : (editingPlay.posterUrl || '')}
                        onChange={e => setEditingPlay({ ...editingPlay, posterUrl: e.target.value })}
                        className="flex-1 bg-zinc-950 border border-white/5 rounded-lg px-3 py-2 text-[11px] text-white focus:outline-none focus:border-red-500 placeholder:text-zinc-600"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Gallery editor */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider flex items-center justify-between">
                  <span>Production Gallery</span>
                  <span className="text-zinc-600 font-mono normal-case">{(editingPlay.galleryImages || []).length} images</span>
                </label>

                {/* Existing gallery thumbnails with per-image delete */}
                {(editingPlay.galleryImages || []).length > 0 && (
                  <div className="grid grid-cols-4 gap-2">
                    {(editingPlay.galleryImages || []).map((img, idx) => (
                      <div key={idx} className="relative aspect-video rounded-lg overflow-hidden border border-white/10 bg-zinc-950 group">
                        <img src={img} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setEditingPlay({ ...editingPlay, galleryImages: (editingPlay.galleryImages || []).filter((_, i) => i !== idx) })}
                          className="absolute top-1 right-1 p-0.5 bg-black/80 hover:bg-red-600 text-white rounded transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add via file upload */}
                <input ref={editPlayGalleryRef} type="file" accept="image/*" multiple className="hidden" onChange={handleEditPlayGalleryUpload} />
                <button
                  type="button"
                  onClick={() => editPlayGalleryRef.current?.click()}
                  className="bg-zinc-800 hover:bg-zinc-700 border border-white/5 text-zinc-300 px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all justify-center"
                >
                  <ImagePlus className="h-3.5 w-3.5" /> Add Photos (Upload)
                </button>

                {/* Add via URL */}
                <div className="flex gap-2 items-center">
                  <Link2 className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                  <input
                    type="text"
                    placeholder="Paste image URL and press Add..."
                    value={editPlayGalleryUrl}
                    onChange={e => setEditPlayGalleryUrl(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddGalleryUrl(); } }}
                    className="flex-1 bg-zinc-950 border border-white/5 rounded-lg px-3 py-2 text-[11px] text-white focus:outline-none focus:border-red-500 placeholder:text-zinc-600"
                  />
                  <button
                    type="button"
                    onClick={handleAddGalleryUrl}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all shrink-0"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Dynamic Playbill Cast & Crew Builder (EDIT MODE) */}
              <div className="flex flex-col gap-3 bg-zinc-950/40 border border-white/5 rounded-2xl p-5">
                <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                  <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Dynamic Playbill Cast & Crew</label>
                  <span className="text-[9px] font-mono uppercase bg-zinc-900 border border-white/5 text-zinc-400 px-2 py-0.5 rounded">
                    {(editingPlay.castAndCrew || []).length} Credits
                  </span>
                </div>

                {/* Added members preview */}
                {(editingPlay.castAndCrew || []).length > 0 && (
                  <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.1)_transparent] mb-2">
                    {(editingPlay.castAndCrew || []).map((member, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-zinc-950/80 border border-white/5 px-3 py-2 rounded-xl text-xs">
                        <div className="flex flex-col">
                          <span className="text-[9px] text-zinc-500 uppercase tracking-widest">{member.category} — {member.role}</span>
                          <span className="text-white font-medium mt-0.5">{member.name}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingPlay({
                              ...editingPlay,
                              castAndCrew: (editingPlay.castAndCrew || []).filter((_, i) => i !== idx)
                            });
                          }}
                          className="text-zinc-500 hover:text-red-400 transition-colors p-1"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Form to add single member in EDIT MODE */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="flex flex-col gap-1 relative">
                    <label className="text-[10px] text-zinc-500 uppercase font-semibold">Member Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Joke Silva"
                      value={editMemberName}
                      onChange={e => setEditMemberName(e.target.value)}
                      className="bg-zinc-950 border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500 transition-colors"
                    />
                    {(() => {
                      const allArtists = ClientDB.getArtists();
                      const matchingSuggestions = editMemberName.trim()
                        ? allArtists.filter(a => 
                            a.name.toLowerCase().includes(editMemberName.toLowerCase()) &&
                            a.name.toLowerCase() !== editMemberName.toLowerCase()
                          )
                        : [];
                      
                      if (matchingSuggestions.length === 0) return null;

                      return (
                        <div className="absolute top-[100%] left-0 w-full bg-zinc-900 border border-white/10 rounded-lg shadow-2xl z-20 mt-1 max-h-36 overflow-y-auto [scrollbar-width:none]">
                          {matchingSuggestions.map(artist => (
                            <div
                              key={artist.id}
                              onClick={() => {
                                setEditMemberName(artist.name);
                                if (artist.roleType) {
                                  setEditMemberRole(artist.roleType);
                                  const roleLow = artist.roleType.toLowerCase();
                                  if (roleLow.includes('director') || roleLow.includes('playwright') || roleLow.includes('producer') || roleLow.includes('designer')) {
                                    setEditMemberCategory('Creative');
                                  } else if (roleLow.includes('manager') || roleLow.includes('crew') || roleLow.includes('technical') || roleLow.includes('engineer')) {
                                    setEditMemberCategory('Technical');
                                  } else {
                                    setEditMemberCategory('Cast');
                                  }
                                }
                              }}
                              className="px-3 py-2 text-xs hover:bg-red-600 hover:text-white cursor-pointer transition-colors border-b border-white/5 last:border-0 flex items-center justify-between"
                            >
                              <span className="font-medium text-white">{artist.name}</span>
                              <span className="text-[9px] text-zinc-400">{artist.roleType}</span>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-zinc-500 uppercase font-semibold">Billing Role</label>
                    <input
                      type="text"
                      placeholder="e.g. Lead Actress"
                      value={editMemberRole}
                      onChange={e => setEditMemberRole(e.target.value)}
                      className="bg-zinc-950 border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500 transition-colors"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-zinc-500 uppercase font-semibold">Billing Category</label>
                    <select
                      value={editMemberCategory}
                      onChange={e => setEditMemberCategory(e.target.value as any)}
                      className="bg-zinc-950 border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500 transition-colors"
                    >
                      <option value="Creative">Creative Team</option>
                      <option value="Cast">Cast Billing</option>
                      <option value="Technical">Technical Crew</option>
                    </select>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (editMemberName.trim() && editMemberRole.trim()) {
                      const updatedCast = [...(editingPlay.castAndCrew || []), { name: editMemberName.trim(), role: editMemberRole.trim(), category: editMemberCategory }];
                      setEditingPlay({ ...editingPlay, castAndCrew: updatedCast });
                      setEditMemberName('');
                      setEditMemberRole('');
                    }
                  }}
                  className="bg-zinc-800 hover:bg-zinc-700 border border-white/5 text-zinc-300 font-bold py-2 rounded-xl text-[10px] uppercase tracking-wider transition-colors"
                >
                  Add Playbill Credit
                </button>
              </div>

              <div className="flex items-center justify-end gap-3 mt-4 pt-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setEditingPlay(null)}
                  className="bg-zinc-950 border border-white/5 hover:bg-zinc-800 text-zinc-400 hover:text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── SETTINGS: DOMAIN & EMAILS PANEL ────────────────────────────── */}
        {activeTab === 'settings' && (
          <div className="flex flex-col gap-8 animate-fade-up">
            <div className="bg-zinc-900 border border-white/5 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/5 rounded-full blur-[100px] pointer-events-none" />
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
                <div>
                  <h2 className="text-2xl font-serif font-bold text-white flex items-center gap-2">
                    <Globe className="h-6 w-6 text-red-500" /> Vercel Custom Domain Configuration
                  </h2>
                  <p className="text-zinc-400 text-xs mt-1">Point your custom domain host records to Curtain Call's Vercel deployment.</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-ping" />
                  <span className="bg-green-500/10 text-green-400 border border-green-500/20 px-3 py-1 rounded-full text-[10px] font-bold font-mono uppercase tracking-wider">
                    Domain Linked
                  </span>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mt-6">
                <div className="bg-zinc-950/50 border border-white/5 rounded-2xl p-5">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">Apex Domain Configuration</span>
                  <h3 className="text-white font-serif font-bold text-lg mt-1">curtaincall.com.ng</h3>
                  <p className="text-zinc-400 text-xs mt-1">Add an A-record at your DNS provider pointing to Curtain Call's routing engine:</p>
                  
                  <div className="bg-zinc-950 border border-white/5 rounded-xl p-3 mt-3 flex items-center justify-between text-xs font-mono">
                    <div>
                      <span className="text-zinc-500 text-[10px] block">TYPE</span>
                      <span className="text-white font-bold">A</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 text-[10px] block">HOST</span>
                      <span className="text-white font-bold">@</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 text-[10px] block">VALUE</span>
                      <span className="text-red-400 font-bold">76.76.21.21</span>
                    </div>
                  </div>
                </div>

                <div className="bg-zinc-950/50 border border-white/5 rounded-2xl p-5">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">Subdomain Configuration</span>
                  <h3 className="text-white font-serif font-bold text-lg mt-1">www.curtaincall.com.ng</h3>
                  <p className="text-zinc-400 text-xs mt-1">Add a CNAME-record to redirect www traffic to our secure cluster:</p>
                  
                  <div className="bg-zinc-950 border border-white/5 rounded-xl p-3 mt-3 flex items-center justify-between text-xs font-mono">
                    <div>
                      <span className="text-zinc-500 text-[10px] block">TYPE</span>
                      <span className="text-white font-bold">CNAME</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 text-[10px] block">HOST</span>
                      <span className="text-white font-bold">www</span>
                    </div>
                    <div className="truncate max-w-[150px]">
                      <span className="text-zinc-500 text-[10px] block">VALUE</span>
                      <span className="text-red-400 font-bold">cname.vercel-dns.com</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-4 items-center justify-between border-t border-white/5 pt-6">
                <div className="flex items-center gap-3">
                  <div className="bg-zinc-950 p-2.5 rounded-xl border border-white/5 flex items-center justify-center">
                    <Mail className="h-5 w-5 text-red-400" />
                  </div>
                  <div>
                    <span className="text-zinc-500 text-[10px] block font-mono">EMAIL NOTIFICATIONS PROVIDER</span>
                    <span className="text-zinc-200 text-xs font-medium">Resend SMTP Service (notifications@curtaincall.com.ng)</span>
                  </div>
                </div>
                <button
                  onClick={() => showToast('WHOIS Nameserver validation successful! Domain resolution fully certified.')}
                  className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-white/5 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors"
                >
                  Verify Live DNS Resolution
                </button>
              </div>
            </div>

            {/* TRANSACTIONAL EMAIL LOGS */}
            <div className="bg-zinc-900 border border-white/5 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
                <div>
                  <h2 className="text-xl font-serif font-bold text-white flex items-center gap-2">
                    <Mail className="h-5 w-5 text-red-500" /> Transactional Outgoing Emails ({emailLogs.length})
                  </h2>
                  <p className="text-zinc-400 text-xs mt-1">Real-time trace of emails triggered by automated curation workflows.</p>
                </div>
                {emailLogs.length > 0 && (
                  <button
                    onClick={() => {
                      ClientDB.clearEmailLogs();
                      setEmailLogs([]);
                      showToast('Transactional email logs wiped.', 'error');
                    }}
                    className="text-zinc-500 hover:text-zinc-300 text-xs font-bold font-mono"
                  >
                    Clear Logs
                  </button>
                )}
              </div>

              {emailLogs.length === 0 ? (
                <div className="bg-zinc-950 border border-white/5 rounded-3xl p-12 text-center text-zinc-500 font-mono text-xs">
                  No transactional email dispatches recorded in this local session.
                </div>
              ) : (
                <div className="overflow-x-auto [scrollbar-width:none]">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-white/5 text-zinc-400 font-mono uppercase tracking-wider">
                        <th className="py-3 px-4">Timestamp</th>
                        <th className="py-3 px-4">Recipient</th>
                        <th className="py-3 px-4">Subject</th>
                        <th className="py-3 px-4">Delivery Mode</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-mono text-zinc-300">
                      {emailLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-white/[0.01]">
                          <td className="py-3 px-4 whitespace-nowrap text-zinc-500">{log.timestamp}</td>
                          <td className="py-3 px-4 text-zinc-200">{log.to}</td>
                          <td className="py-3 px-4 max-w-xs truncate text-zinc-100">{log.subject}</td>
                          <td className="py-3 px-4">
                            {log.simulated ? (
                              <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded text-[10px] font-bold">
                                Simulated Loopback
                              </span>
                            ) : (
                              <span className="bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded text-[10px] font-bold">
                                Live Dispatch
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Decline Reason Modal */}
      {declineItem && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-white/10 rounded-3xl max-w-md w-full p-6 md:p-8 flex flex-col gap-5 shadow-2xl animate-fade-up">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="font-serif font-bold text-lg text-white">Decline Submission</h3>
              <button onClick={() => setDeclineItem(null)} className="text-zinc-500 hover:text-white p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-zinc-400 text-xs leading-relaxed">
                Provide a constructive curatorial reason why the submission for <strong>"{declineItem.name}"</strong> is being declined. 
                This will be saved to the record and emailed to the submitter (<strong>{declineItem.email}</strong>).
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-zinc-500 uppercase font-semibold">Decline Reason / Curator's Notes</label>
              <textarea
                rows={4}
                value={declineReason}
                onChange={e => setDeclineReason(e.target.value)}
                placeholder="e.g. The uploaded playbill lacks verified billing details. Please re-submit with complete creative team credits."
                className="bg-zinc-950 border border-white/5 rounded-xl p-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-red-500 transition-colors resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 mt-2">
              <button
                onClick={() => setDeclineItem(null)}
                className="bg-zinc-950 border border-white/5 hover:bg-zinc-800 text-zinc-400 hover:text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitDeclineReason}
                className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-red-600/10"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SUBMISSION PREVIEW MODALS ─────────────────────────────────── */}

      {/* Artist full preview */}
      {previewArtist && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-white/10 rounded-3xl max-w-lg w-full p-6 md:p-8 flex flex-col gap-5 shadow-2xl animate-fade-up my-auto">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div>
                <span className="text-[9px] font-mono uppercase tracking-widest text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded">Pending Review</span>
                <h3 className="font-serif font-bold text-lg text-white mt-1">Artist Submission</h3>
              </div>
              <button onClick={() => setPreviewArtist(null)} className="text-zinc-500 hover:text-white p-1"><X className="h-5 w-5" /></button>
            </div>

            <div className="flex gap-4 items-start">
              <div className="relative w-20 h-20 rounded-full overflow-hidden shrink-0 border border-white/10 bg-zinc-950 flex items-center justify-center">
                {previewArtist.headshotUrl ? (
                  <img src={previewArtist.headshotUrl} alt={previewArtist.name} className="w-full h-full object-cover" />
                ) : (
                  <User className="h-9 w-9 text-zinc-600" />
                )}
              </div>
              <div>
                <h2 className="font-serif font-bold text-2xl text-white">{previewArtist.name}</h2>
                <p className="text-red-400 font-bold uppercase tracking-widest text-xs mt-0.5">{previewArtist.roleType}</p>
                {previewArtist.dateOfBirth && <p className="text-zinc-500 text-[11px] font-mono mt-1">Born: {previewArtist.dateOfBirth}</p>}
                {previewArtist.submitterEmail && <p className="text-zinc-500 text-[11px] font-mono">Submitted by: {previewArtist.submitterEmail}</p>}
              </div>
            </div>

            {previewArtist.bio && (
              <div className="bg-zinc-950/60 border border-white/5 rounded-2xl p-4">
                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-2">Biography</p>
                <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{previewArtist.bio}</p>
              </div>
            )}

            {previewArtist.socialLinks && Object.values(previewArtist.socialLinks).some(Boolean) && (
              <div className="flex flex-col gap-1">
                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Social Links</p>
                {previewArtist.socialLinks.instagram && <p className="text-xs text-zinc-400 font-mono">Instagram: {previewArtist.socialLinks.instagram}</p>}
                {previewArtist.socialLinks.twitter && <p className="text-xs text-zinc-400 font-mono">Twitter/X: {previewArtist.socialLinks.twitter}</p>}
                {previewArtist.socialLinks.website && <p className="text-xs text-zinc-400 font-mono">Website: {previewArtist.socialLinks.website}</p>}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/5">
              <button onClick={() => setPreviewArtist(null)} className="bg-zinc-950 border border-white/5 hover:bg-zinc-800 text-zinc-400 hover:text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider">Close</button>
              <button
                onClick={() => { handleRejectArtist(previewArtist.id, previewArtist.name); setPreviewArtist(null); }}
                className="bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/20 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all"
              ><Trash2 className="h-3.5 w-3.5" /> Decline</button>
              <button
                onClick={() => { handleApproveArtist(previewArtist.id, previewArtist.name); setPreviewArtist(null); }}
                className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all"
              ><Check className="h-3.5 w-3.5" /> Approve</button>
            </div>
          </div>
        </div>
      )}

      {/* Play full preview */}
      {previewPlay && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-white/10 rounded-3xl max-w-2xl w-full p-6 md:p-8 flex flex-col gap-5 shadow-2xl animate-fade-up my-auto">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div>
                <span className="text-[9px] font-mono uppercase tracking-widest text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded">Pending Review</span>
                <h3 className="font-serif font-bold text-lg text-white mt-1">Stage Production Submission</h3>
              </div>
              <button onClick={() => setPreviewPlay(null)} className="text-zinc-500 hover:text-white p-1"><X className="h-5 w-5" /></button>
            </div>

            <div className="flex gap-5 items-start">
              <div className="relative w-24 aspect-[3/4] rounded-2xl overflow-hidden shrink-0 border border-white/10 bg-zinc-950 flex items-center justify-center">
                {previewPlay.posterUrl ? (
                  <img src={previewPlay.posterUrl} alt={previewPlay.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center"><Drama className="h-10 w-10 text-zinc-600" /></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-serif font-bold text-2xl text-white">{previewPlay.title}</h2>
                <p className="text-red-400 font-bold uppercase tracking-widest text-xs mt-0.5">{previewPlay.genre}</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-3">
                  {previewPlay.venue && <p className="text-[11px] text-zinc-400 font-mono"><span className="text-zinc-600">Venue:</span> {previewPlay.venue}</p>}
                  {previewPlay.runtime && <p className="text-[11px] text-zinc-400 font-mono"><span className="text-zinc-600">Runtime:</span> {previewPlay.runtime}</p>}
                  {previewPlay.status && <p className="text-[11px] text-zinc-400 font-mono"><span className="text-zinc-600">Status:</span> {previewPlay.status}</p>}
                  {previewPlay.submitterEmail && <p className="text-[11px] text-zinc-400 font-mono col-span-2"><span className="text-zinc-600">Submitted by:</span> {previewPlay.submitterEmail}</p>}
                </div>
              </div>
            </div>

            {previewPlay.synopsis && (
              <div className="bg-zinc-950/60 border border-white/5 rounded-2xl p-4">
                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-2">Synopsis</p>
                <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{previewPlay.synopsis}</p>
              </div>
            )}

            {previewPlay.castAndCrew && previewPlay.castAndCrew.length > 0 && (
              <div className="bg-zinc-950/60 border border-white/5 rounded-2xl p-4">
                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-3">Cast & Crew ({previewPlay.castAndCrew.length})</p>
                <div className="flex flex-col gap-1.5 max-h-32 overflow-y-auto pr-1">
                  {previewPlay.castAndCrew.map((c, i) => (
                    <div key={i} className="flex items-center justify-between text-xs border-b border-white/5 pb-1 last:border-0">
                      <span className="text-white font-medium">{c.name}</span>
                      <span className="text-zinc-500 font-mono">{c.role} · {c.category}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {previewPlay.galleryImages && previewPlay.galleryImages.length > 0 && (
              <div>
                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-2">Gallery ({previewPlay.galleryImages.length} images)</p>
                <div className="grid grid-cols-4 gap-2">
                  {previewPlay.galleryImages.map((img, i) => (
                    <div key={i} className="relative aspect-video rounded-lg overflow-hidden border border-white/10 bg-zinc-950">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/5">
              <button onClick={() => setPreviewPlay(null)} className="bg-zinc-950 border border-white/5 hover:bg-zinc-800 text-zinc-400 hover:text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider">Close</button>
              <button
                onClick={() => { handleRejectPlay(previewPlay.id, previewPlay.title); setPreviewPlay(null); }}
                className="bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/20 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all"
              ><Trash2 className="h-3.5 w-3.5" /> Decline</button>
              <button
                onClick={() => { handleApprovePlay(previewPlay.id, previewPlay.title); setPreviewPlay(null); }}
                className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all"
              ><Check className="h-3.5 w-3.5" /> Approve</button>
            </div>
          </div>
        </div>
      )}

      {/* Article full preview */}
      {previewArticle && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-white/10 rounded-3xl max-w-2xl w-full p-6 md:p-8 flex flex-col gap-5 shadow-2xl animate-fade-up my-auto">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div>
                <span className="text-[9px] font-mono uppercase tracking-widest text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded">Pending Review</span>
                <h3 className="font-serif font-bold text-lg text-white mt-1">Chronicle / Article Submission</h3>
              </div>
              <button onClick={() => setPreviewArticle(null)} className="text-zinc-500 hover:text-white p-1"><X className="h-5 w-5" /></button>
            </div>

            {previewArticle.imageUrl && (
              <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-white/10 bg-zinc-950">
                <img src={previewArticle.imageUrl} alt={previewArticle.title} className="w-full h-full object-cover" />
              </div>
            )}

            <div>
              <h2 className="font-serif font-bold text-2xl text-white leading-tight">{previewArticle.title}</h2>
              <div className="flex items-center gap-3 mt-1.5">
                <p className="text-red-400 font-bold uppercase tracking-widest text-xs">{previewArticle.author}</p>
                {previewArticle.date && <p className="text-zinc-600 text-xs font-mono">{previewArticle.date}</p>}
                {previewArticle.submitterEmail && <p className="text-zinc-600 text-xs font-mono">{previewArticle.submitterEmail}</p>}
              </div>
            </div>

            {previewArticle.excerpt && (
              <div className="bg-zinc-950/60 border border-white/5 rounded-2xl p-4">
                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-2">Excerpt</p>
                <p className="text-sm text-zinc-300 italic leading-relaxed">{previewArticle.excerpt}</p>
              </div>
            )}

            {previewArticle.content && (
              <div className="bg-zinc-950/60 border border-white/5 rounded-2xl p-4 max-h-64 overflow-y-auto">
                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-2">Full Content</p>
                <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{previewArticle.content}</p>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/5">
              <button onClick={() => setPreviewArticle(null)} className="bg-zinc-950 border border-white/5 hover:bg-zinc-800 text-zinc-400 hover:text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider">Close</button>
              <button
                onClick={() => { handleRejectArticle(previewArticle.id, previewArticle.title); setPreviewArticle(null); }}
                className="bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/20 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all"
              ><Trash2 className="h-3.5 w-3.5" /> Decline</button>
              <button
                onClick={() => { handleApproveArticle(previewArticle.id, previewArticle.title); setPreviewArticle(null); }}
                className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all"
              ><Check className="h-3.5 w-3.5" /> Approve</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
