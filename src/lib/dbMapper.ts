import { Production } from './types';

export const mapProductionFromDb = (row: any): Production => {
  const galleryImages: string[] = [];
  let ticketTiers: any[] = [];
  let productionType: 'Student' | 'Professional' | undefined = undefined;
  let showTime: string | undefined = undefined;
  let isProducerManaged: boolean | undefined = undefined;
  let externalTicketUrl: string | undefined = undefined;
  let eventTypeFallback: string | undefined = undefined;
  let customEventTypeFallback: string | undefined = undefined;
  let parsedDates: any[] | undefined = undefined;
  
  if (row.gallery_images && Array.isArray(row.gallery_images)) {
    row.gallery_images.forEach((item: any) => {
      if (typeof item === 'string' && item.startsWith('{"__ticketTiers":')) {
        try {
          const parsed = JSON.parse(item);
          ticketTiers = parsed.__ticketTiers;
        } catch (e) {
          // ignore
        }
      } else if (typeof item === 'string' && item.startsWith('{"__productionType":')) {
        try {
          const parsed = JSON.parse(item);
          productionType = parsed.__productionType;
        } catch (e) {
          // ignore
        }
      } else if (typeof item === 'string' && item.startsWith('{"__showTime":')) {
        try {
          const parsed = JSON.parse(item);
          showTime = parsed.__showTime;
        } catch (e) {
          // ignore
        }
      } else if (typeof item === 'string' && item.startsWith('{"__isProducerManaged":')) {
        try {
          const parsed = JSON.parse(item);
          isProducerManaged = parsed.__isProducerManaged;
        } catch (e) {
          // ignore
        }
      } else if (typeof item === 'string' && item.startsWith('{"__externalTicketUrl":')) {
        try {
          const parsed = JSON.parse(item);
          externalTicketUrl = parsed.__externalTicketUrl;
        } catch (e) {}
      } else if (typeof item === 'string' && item.startsWith('{"__eventType":')) {
        try { eventTypeFallback = JSON.parse(item).__eventType; } catch(e) {}
      } else if (typeof item === 'string' && item.startsWith('{"__customEventType":')) {
        try { customEventTypeFallback = JSON.parse(item).__customEventType; } catch(e) {}
      } else if (typeof item === 'string' && item.startsWith('{"__dates":')) {
        try { parsedDates = JSON.parse(item).__dates; } catch(e) {}
      } else {
        galleryImages.push(item);
      }
    });
  }

  let parsedCreatedAt = row.created_at || null;
  if (!parsedCreatedAt) {
    const match = row.id?.match(/(\d{10,})/);
    if (match) {
      try {
        const timestamp = parseInt(match[0], 10);
        if (!isNaN(timestamp) && timestamp > 0) {
          const scaleTimestamp = timestamp < 9999999999 ? timestamp * 1000 : timestamp;
          parsedCreatedAt = new Date(scaleTimestamp).toISOString();
        }
      } catch (e) {
        // ignore
      }
    }
  }

  return {
    id: row.id,
    slug: row.slug || null,
    title: row.title,
    eventType: eventTypeFallback || row.event_type || row.eventType || 'Theatre',
    customEventType: customEventTypeFallback || row.custom_event_type || row.customEventType || null,
    synopsis: row.synopsis,
    genre: row.genre,
    runtime: row.runtime,
    venue: row.venue,
    status: row.status,
    posterUrl: row.poster_url || row.posterUrl,
    criticScore: row.critic_score || row.criticScore,
    audienceScore: row.audience_score || row.audienceScore ? parseFloat(row.audience_score || row.audienceScore) : null,
    totalReviews: row.total_reviews || row.totalReviews,
    galleryImages: galleryImages.length > 0 ? galleryImages : (row.galleryImages || []),
    submitterEmail: row.submitter_email || row.submitterEmail,
    curationStatus: row.curation_status || row.curationStatus,
    castAndCrew: row.cast_and_crew || row.castAndCrew || [],
    showDate: row.show_date || row.showDate,
    showTime: showTime !== undefined ? showTime : row.showTime,
    isProducerManaged: isProducerManaged !== undefined ? isProducerManaged : row.isProducerManaged,
    dates: parsedDates || row.dates,
    declineReason: row.decline_reason || row.declineReason || null,
    ticketTiers: ticketTiers.length > 0 ? ticketTiers : row.ticketTiers,
    productionType: productionType || row.productionType,
    externalTicketUrl: externalTicketUrl || row.externalTicketUrl,
    createdAt: parsedCreatedAt || row.createdAt
  };
};
