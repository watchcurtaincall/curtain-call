import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { verifyUserSession } from '@/lib/quiz/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  if (!supabaseServer) {
    return NextResponse.json({ error: 'Supabase service client not configured' }, { status: 500 });
  }

  try {
    const verifiedUser = await verifyUserSession(request);
    if (!verifiedUser || verifiedUser.email !== 'watchcurtaincall@gmail.com') {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
    }
    // Fetch all attempts
    const { data: attempts, error: attemptsErr } = await supabaseServer
      .from('quiz_attempts')
      .select('quiz_date, result_type, score');

    if (attemptsErr) {
      throw attemptsErr;
    }

    // Fetch quiz days for email stats
    const { data: quizDays, error: quizDaysErr } = await supabaseServer
      .from('quiz_days')
      .select('quiz_date, emails_sent, emails_opened');

    if (quizDaysErr) {
      // It's possible the columns don't exist yet if the user hasn't run the SQL.
      // We'll catch this and fallback.
      console.warn('[API Quiz Stats] Error fetching quiz_days (schema might need update):', quizDaysErr);
    }

    // Aggregate Data
    let totalAttempts = 0;
    let totalPassed = 0;
    let totalWon = 0;

    const dailyStats: Record<string, any> = {};

    // Process attempts
    for (const a of (attempts || [])) {
      totalAttempts++;
      if (a.score === 5) totalPassed++;
      if (a.result_type === 'won') totalWon++;

      if (!dailyStats[a.quiz_date]) {
        dailyStats[a.quiz_date] = {
          date: a.quiz_date,
          attempts: 0,
          passed: 0,
          failed: 0,
          won: 0,
          emailsSent: 0,
          emailsOpened: 0
        };
      }
      
      dailyStats[a.quiz_date].attempts++;
      if (a.score === 5) {
        dailyStats[a.quiz_date].passed++;
      } else {
        dailyStats[a.quiz_date].failed++;
      }
      if (a.result_type === 'won') dailyStats[a.quiz_date].won++;
    }

    // Process email stats
    let totalEmailsSent = 0;
    let totalEmailsOpened = 0;

    for (const d of (quizDays || [])) {
      const sent = d.emails_sent || 0;
      const opened = d.emails_opened || 0;
      
      totalEmailsSent += sent;
      totalEmailsOpened += opened;

      if (!dailyStats[d.quiz_date]) {
        dailyStats[d.quiz_date] = {
          date: d.quiz_date,
          attempts: 0,
          passed: 0,
          failed: 0,
          won: 0,
          emailsSent: 0,
          emailsOpened: 0
        };
      }
      dailyStats[d.quiz_date].emailsSent = sent;
      dailyStats[d.quiz_date].emailsOpened = opened;
    }

    const dailyArray = Object.values(dailyStats).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({
      success: true,
      totals: {
        attempts: totalAttempts,
        passed: totalPassed,
        failed: totalAttempts - totalPassed,
        won: totalWon,
        emailsSent: totalEmailsSent,
        emailsOpened: totalEmailsOpened,
        openRate: totalEmailsSent > 0 ? ((totalEmailsOpened / totalEmailsSent) * 100).toFixed(1) : 0
      },
      daily: dailyArray
    });

  } catch (error: any) {
    console.error('[API Quiz Stats Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
