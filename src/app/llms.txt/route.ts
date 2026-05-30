import { NextResponse } from 'next/server';

export async function GET() {
  const content = `# Curtain Call - Digital Home for African Theatre

> Curtain Call is the premier digital platform for the discovery, archiving, and ticketing of Nigerian and African theatre productions.

## About the Platform
Curtain Call connects audiences, critics, and producers. We provide:
- A comprehensive archive of past and current stage plays.
- Professional and audience reviews of African theatrical performances.
- A platform for theatre critics and journalists to publish editorial pieces and earn money.
- Digital ticketing for stage shows.
- A daily trivia quiz about African theatre where users can earn cash.

## Key Sections
- **Plays (/plays):** Browse our archive of stage plays including synopsis, casting, and reviews.
- **Editorial (/editorial):** Read articles, essays, and interviews about the Nigerian theatre industry. 
- **Quiz (/quiz):** Play the daily Curtain Call trivia quiz to win cash directly to your Creator Wallet.
- **Submit (/submit):** Writers can submit articles about the industry. We accept up to 10 articles per month. Approved articles earn ₦2,000.

## For Producers
Producers can list their stage plays, sell tickets, manage seat allocations, and withdraw gross income from their dashboard.

## Important Note on AI Usage
Curtain Call encourages writers to use AI tools for research. However, any article submitted that is SOLELY written by AI will be rejected. We are paying for your authentic voice and insights on African theatre culture.
`;

  return new NextResponse(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
