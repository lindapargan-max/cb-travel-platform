/**
 * JLT Terms Fetcher
 *
 * Fetches the live Booking Terms & Conditions from The JLT Group's hub page
 * and caches them in memory (6-hour TTL). Falls back to the last-known content
 * if the live fetch fails or returns unparseable HTML.
 *
 * To auto-refresh terms: the cache expires every 6 hours, so the next request
 * after expiry will attempt a fresh fetch from hub.thejltgroup.co.uk.
 */

export interface JLTSection {
  number: string;
  title: string;
  contentHtml: string;
}

interface TermsCache {
  sections: JLTSection[];
  fetchedAt: Date;
  lastUpdated: string;
  source: "live" | "fallback";
}

let cache: TermsCache | null = null;
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

// ---------------------------------------------------------------------------
// HTML Parser
// Try to extract sections from the raw HTML using the known id="jlt-sec-N" pattern.
// ---------------------------------------------------------------------------
function parseTermsHtml(html: string): { sections: JLTSection[]; lastUpdated: string } | null {
  try {
    const sections: JLTSection[] = [];

    // Extract "Last updated" from the page
    const lastUpdatedMatch = html.match(/Last updated:?\s*([A-Za-z]+\s+\d{4})/i);
    const lastUpdated = lastUpdatedMatch?.[1] ?? "March 2026";

    for (let i = 1; i <= 22; i++) {
      // Find the start of this section
      const sectionStartRegex = new RegExp(`id=["']jlt-sec-${i}["']`, "i");
      const sectionStartMatch = html.match(sectionStartRegex);
      if (!sectionStartMatch || sectionStartMatch.index === undefined) continue;

      const from = sectionStartMatch.index;

      // Find the start of the next section (or end of doc) to bound extraction
      const nextSectionRegex = new RegExp(`id=["']jlt-sec-${i + 1}["']`, "i");
      const nextSectionMatch = html.match(nextSectionRegex);
      const to =
        nextSectionMatch && nextSectionMatch.index !== undefined
          ? nextSectionMatch.index
          : from + 15000;

      const sectionHtml = html.slice(from, to);

      // Extract section title from <h2> or <h3>
      const titleMatch = sectionHtml.match(/<h[23][^>]*>([\s\S]*?)<\/h[23]>/i);
      if (!titleMatch) continue;
      const title = titleMatch[1].replace(/<[^>]+>/g, "").trim();

      // Get the content after the title heading
      const afterTitle = sectionHtml.slice(
        sectionHtml.indexOf(titleMatch[0]) + titleMatch[0].length
      );

      // Clean JLT-specific classes and inline styles, keep semantic HTML
      const cleanedHtml = afterTitle
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/\s*class="[^"]*"/gi, "")
        .replace(/\s*style="[^"]*"/gi, "")
        .replace(/\s*id="[^"]*"/gi, "")
        .replace(/<div[^>]*>/gi, "<div>")
        .replace(/<span[^>]*>/gi, "<span>")
        .replace(/<a\s+href="([^"]*)"[^>]*>/gi, '<a href="$1">')
        .trim();

      sections.push({ number: String(i), title, contentHtml: cleanedHtml });
    }

    return sections.length >= 10 ? { sections, lastUpdated } : null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function getJLTTerms(): Promise<TermsCache> {
  // Return memory cache if still fresh
  if (cache && Date.now() - cache.fetchedAt.getTime() < CACHE_TTL_MS) {
    return cache;
  }

  // Attempt a live fetch from JLT
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const res = await fetch("https://hub.thejltgroup.co.uk/bookingterms", {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-GB,en;q=0.9",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      const html = await res.text();
      const parsed = parseTermsHtml(html);
      if (parsed) {
        console.log(`[JLT Terms] Live fetch successful — ${parsed.sections.length} sections parsed`);
        cache = {
          sections: parsed.sections,
          fetchedAt: new Date(),
          lastUpdated: parsed.lastUpdated,
          source: "live",
        };
        return cache;
      }
      // HTML fetched but couldn't parse (likely SPA-rendered content) — fall through
      console.warn("[JLT Terms] HTML fetched but content not found in static HTML (may be SPA-rendered). Using fallback.");
    }
  } catch (err: any) {
    console.warn("[JLT Terms] Live fetch failed:", err?.message ?? err);
  }

  // Fall back to hardcoded known-good content
  console.log("[JLT Terms] Using hardcoded fallback content");
  cache = {
    sections: FALLBACK_SECTIONS,
    fetchedAt: new Date(),
    lastUpdated: "March 2026",
    source: "fallback",
  };
  return cache;
}

/** Force-clear the cache so the next call re-fetches from JLT */
export function clearJLTTermsCache(): void {
  cache = null;
}

// ---------------------------------------------------------------------------
// Fallback content — exact wording from hub.thejltgroup.co.uk/bookingterms
// as at March 2026. Updated automatically when live fetch succeeds.
// ---------------------------------------------------------------------------
const FALLBACK_SECTIONS: JLTSection[] = [
  {
    number: "1",
    title: "Introduction",
    contentHtml: `
      <p>These Terms and Conditions ("Terms") set out the agreement between Janine Loves Ltd trading as The JLT Group ("we", "us", "our") and the customer ("you", "your") when booking travel services through one of our authorised travel agents ("Agent"). By making a booking, you confirm that you are over 18 years of age, that you have read and agree to these Terms, and that you accept responsibility for all persons listed on the booking. Your contract comes into existence when we or the relevant supplier issue a written booking confirmation.</p>
      <h4>Agent Authority</h4>
      <p>Our Agents are authorised to sell travel services on our behalf but are not authorised to make any verbal promises, guarantees, or amendments to these Terms unless confirmed by us in writing.</p>
    `,
  },
  {
    number: "2",
    title: "Our Role",
    contentHtml: `
      <p>The JLT Group operates in multiple capacities depending on the nature of your booking. The specific role we hold will be confirmed in your booking documentation.</p>
      <h4>Acting as Agent</h4>
      <p>Where we act as an agent on behalf of third-party suppliers or tour operators, your contract is directly with that supplier. Their booking conditions apply and may limit or exclude their liability. We are not responsible for the performance of the supplier's services, but we will assist you in resolving any issues.</p>
      <h4>Acting as Principal (Tour Operator)</h4>
      <p>Where we create and sell packages directly under our ATOL or PTS protection, your contract is with us. We are responsible for the proper delivery of the contracted services under the Package Travel and Linked Travel Arrangements Regulations 2018.</p>
      <p>If you are unsure of our role in your booking, please contact your Agent or our support team at <a href="mailto:support@thejltgroup.co.uk">support@thejltgroup.co.uk</a> before proceeding.</p>
    `,
  },
  {
    number: "3",
    title: "Booking, Payment, and Pricing Errors",
    contentHtml: `
      <p>A deposit or full payment is required at the time of booking. Where only a deposit is paid, the remaining balance must be received by the due date specified on your confirmation. Failure to pay the balance on time may result in the cancellation of your booking and the application of cancellation charges.</p>
      <h4>Pricing Errors and Omissions</h4>
      <p>We reserve the right to correct obvious errors in both advertised and confirmed prices. If an obvious error is identified after booking, we will notify you as soon as possible and give you the option to pay the correct price or cancel for a full refund.</p>
      <h4>Non-Refundable Deposits and Fees</h4>
      <p>All deposits, administrative fees, service charges, and joining or subscription fees are strictly non-refundable unless otherwise expressly stated at the time of booking. We commit to suppliers and incur costs on your behalf immediately upon confirmation.</p>
      <h4>Chargeback Protection</h4>
      <p>You agree not to initiate an unwarranted chargeback via your credit or debit card provider in respect of non-refundable deposits, cancellation fees, or services properly rendered. If you initiate a chargeback prior to your date of travel, we reserve the right to treat this as a cancellation by you and immediately terminate your booking. Standard cancellation charges will apply. Should an unjustified chargeback be raised at any time, you will remain liable for the original booking cost plus any administrative, legal, or recovery costs incurred by us or our Agents.</p>
      <h4>Accuracy of Booking Details</h4>
      <p>You must check all documentation carefully upon receipt and notify us immediately of any errors. It is essential that all names match passports exactly. We do not charge for correcting our own documentation errors, but any supplier fees arising from incorrect information provided by you will be passed on to you.</p>
    `,
  },
  {
    number: "4",
    title: "Service Charges",
    contentHtml: `
      <p>Service charges may apply to your booking and will be included in your total cost. These may include, but are not limited to:</p>
      <table>
        <thead>
          <tr>
            <th>Charge</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Standard Booking Service Charge</td>
            <td>Applied to all bookings as an administration fee</td>
          </tr>
          <tr>
            <td>ATOL Fee</td>
            <td>Applied to all flight-inclusive packages where we act as principal</td>
          </tr>
          <tr>
            <td>Supplier Failure Insurance (SFI)</td>
            <td>May be included automatically in relevant bookings</td>
          </tr>
        </tbody>
      </table>
    `,
  },
  {
    number: "5",
    title: "Flights",
    contentHtml: `
      <p>Where we act as your agent for standalone flight bookings, your contract is with the airline and their terms apply. We accept no liability for the flight itself. Where flights form part of a package sold by us as principal, we are responsible for the full package.</p>
      <p>Charter flights may be booked either as agent (in which case your contract is with the charter flight provider) or as part of a package sold by us (in which case the booking is covered under our ATOL protection). The applicable arrangement will be confirmed in your booking documentation.</p>
    `,
  },
  {
    number: "6",
    title: "Changes and Cancellations by You",
    contentHtml: `
      <p>All requests to amend or cancel a booking must be made in writing by the lead passenger as soon as possible. Your notice takes effect from the date it is received in writing by us. Since we incur costs in cancelling or changing arrangements, the following charges apply.</p>
      <h4>Amendment Fees</h4>
      <p>Changes to confirmed bookings are subject to an administration fee of <strong>£25 per person per change</strong>, in addition to any charges levied by the relevant supplier. Changes cannot be guaranteed and where we are unable to make a requested change, the original booking will stand.</p>
      <h4>Cancellation Charges</h4>
      <p>The following table sets out the standard cancellation charges for package holidays. Accommodation-only and other arrangements may be subject to different charges, which will be confirmed at the time of booking.</p>
      <table>
        <thead>
          <tr>
            <th>Written Notice Received Before Departure</th>
            <th>Cancellation Charge</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>More than 70 days</td>
            <td>Loss of deposit</td>
          </tr>
          <tr>
            <td>70 to 29 days</td>
            <td>50% of total holiday cost (or loss of deposit if greater)</td>
          </tr>
          <tr>
            <td>28 to 15 days</td>
            <td>75% of total holiday cost (or loss of deposit if greater)</td>
          </tr>
          <tr>
            <td>14 days to day of departure</td>
            <td>100% of total holiday cost</td>
          </tr>
        </tbody>
      </table>
      <h4>Supplier Cancellation Terms</h4>
      <p>The cancellation charges shown above represent the <strong>minimum charges applicable</strong>. Where a supplier's own cancellation terms impose a higher charge (for example, where non-refundable payments have already been made to an airline, cruise line, hotel, or tour operator on your behalf), the actual cancellation charge will be the higher of the two amounts. We will always advise you of any supplier-specific cancellation terms at the time of booking, and these will be noted on your booking confirmation.</p>
      <h4>Ticketed Flights</h4>
      <p>Flights are ticketed upon receipt of your <strong>balance payment in full</strong>. Once flights have been ticketed, the cost of those flights is immediately and wholly non-refundable by the airline and will be retained in full in the event of any subsequent cancellation by you, regardless of the date of cancellation. The total cancellation charge will be the higher of either the standard cancellation charge shown in the table above, or the actual non-refundable flight cost, whichever is greater. <strong>You are strongly advised to ensure your travel insurance is in place before making your balance payment.</strong></p>
      <h4>Cancellation Due to Extraordinary Circumstances</h4>
      <p>You may cancel a package arrangement prior to its commencement without paying a cancellation charge if unavoidable and extraordinary circumstances (as described in Clause 11) are occurring at your destination and significantly affect the performance of the package.</p>
      <h4>FCDO Advice Changes</h4>
      <p>If the Foreign, Commonwealth &amp; Development Office (FCDO) advises against all but essential travel to your destination after you have booked, and this advice remains in place on your date of departure, you will be entitled to cancel your package holiday and receive a full refund.</p>
    `,
  },
  {
    number: "7",
    title: "Changes and Cancellations by Us or the Supplier",
    contentHtml: `
      <h4>Supplier-Initiated Changes</h4>
      <p>If a supplier amends or cancels your booking, we will inform you as soon as reasonably possible. Any alternatives or refunds offered by the supplier will be communicated to you, and you must respond within the timeframe specified. We are not liable for supplier-initiated changes unless we are acting as the package organiser.</p>
      <h4>Significant Changes by Us (Packages)</h4>
      <p>Where we are the package organiser and are required to make a significant change before departure (including a change of departure time by more than 12 hours, a significant downgrade in accommodation standard, or a material change to the itinerary), we will offer you the choice to: (i) accept the change; (ii) accept an alternative arrangement of comparable standard; or (iii) cancel and receive a full refund of all monies paid.</p>
      <h4>Price Adjustments (Packages)</h4>
      <p>We reserve the right to adjust the price of a package booking due to changes in transportation costs, taxes, fees, or exchange rates. If a price increase exceeds 8% of the total holiday cost, you may cancel and receive a full refund. If prices decrease, a refund will be made minus our reasonable administrative expenses.</p>
    `,
  },
  {
    number: "8",
    title: "Our Responsibility and Liability",
    contentHtml: `
      <h4>When Acting as Agent</h4>
      <p>We have a duty to select suppliers using reasonable skill and care. However, we have no liability for the actual provision of services by the supplier or for any acts or omissions of the supplier's employees or agents, except where we have been negligent in our selection.</p>
      <h4>When Acting as Principal (Packages)</h4>
      <p>We accept responsibility for the proper performance of your package. If any part of the package is not provided as contracted, we will remedy the issue or pay you appropriate compensation, unless the failure is attributable to you, to a third party unconnected with the provision of the services, or to unavoidable and extraordinary circumstances.</p>
      <h4>Limitation of Liability</h4>
      <p>For package holidays, our maximum liability to you (excluding personal injury, illness, or death caused by our negligence, for which liability is not limited) is limited to <strong>three times the price paid</strong> by or on behalf of the person(s) affected. We accept no liability for services that do not form part of our contracted arrangements, including any excursions or activities booked independently. Our liability is further subject to the limits imposed by applicable International Conventions, including the Montreal Convention in respect of flights.</p>
    `,
  },
  {
    number: "9",
    title: "Financial Protection",
    contentHtml: `
      <p>All bookings are financially protected through our membership with <strong>Protected Trust Services (PTS No. 6090)</strong>. Your money is held in trust and is safeguarded in the event of our insolvency. For further information, visit <a href="https://www.protectedtrustservices.com/consumer" target="_blank" rel="noopener noreferrer">www.protectedtrustservices.com/consumer</a>.</p>
      <p>For flight-inclusive packages where we act as the principal, your booking is additionally protected under our <strong>ATOL licence (ATOL No. 12564)</strong>. You will receive an ATOL Certificate confirming the scope of your cover. Where we act as an agent, the relevant supplier's ATOL protection will apply and will be clearly identified in your booking documentation.</p>
    `,
  },
  {
    number: "10",
    title: "Package Holidays",
    contentHtml: `
      <p>Where we act as the package organiser under the Package Travel and Linked Travel Arrangements Regulations 2018, we are responsible for ensuring all travel services are delivered as promised, even where they are performed by third-party suppliers. Packages may be transferred to another person, subject to an administration fee of £50–£100 and any applicable supplier charges, provided reasonable notice is given. We will provide appropriate assistance to travellers who experience difficulty during a package holiday.</p>
    `,
  },
  {
    number: "11",
    title: "Unavoidable and Extraordinary Circumstances (Force Majeure)",
    contentHtml: `
      <p>We will not be liable or pay compensation if our contractual obligations are affected by unavoidable and extraordinary circumstances that neither we nor the relevant supplier could have anticipated or avoided. Such circumstances include, but are not limited to, warfare, acts of terrorism, significant risks to human health (including pandemics), natural disasters, severe weather, industrial action, and government or regulatory actions. In such cases, we will take all reasonable steps to minimise the impact on your arrangements.</p>
    `,
  },
  {
    number: "12",
    title: "Insurance",
    contentHtml: `
      <p>It is a <strong>condition of booking</strong> that you arrange adequate travel insurance for yourself and all members of your party. Your policy must, as a minimum, cover cancellation, medical expenses, and repatriation. We are not liable for any losses or costs that would have been covered by a suitable travel insurance policy. If you choose to travel without adequate insurance, we will not be responsible for any losses you suffer as a result.</p>
    `,
  },
  {
    number: "13",
    title: "Passports, Visas, and Health Requirements",
    contentHtml: `
      <p>You are solely responsible for ensuring that you and all members of your party hold valid passports, any required visas, and meet all health and entry requirements for your destination and any transit countries. Passports must generally be valid for at least 6 months beyond your return date. You must also ensure that all Advanced Passenger Information required by airlines is submitted accurately and on time.</p>
      <p>We are not liable for any costs, fines, penalties, or losses incurred as a result of your failure to hold the correct documentation or meet entry requirements. We strongly recommend checking the latest FCDO travel advice at <a href="https://www.gov.uk/foreign-travel-advice" target="_blank" rel="noopener noreferrer">www.gov.uk/foreign-travel-advice</a> before booking and before travel.</p>
    `,
  },
  {
    number: "14",
    title: "Special Requests",
    contentHtml: `
      <p>Any special requests (including dietary requirements, room preferences, or accessibility needs) must be communicated at the time of booking. We will pass these on to the relevant supplier, but we cannot guarantee they will be met and their non-fulfilment does not constitute a breach of contract.</p>
      <p>If you or any member of your party has a medical condition, disability, or reduced mobility that may affect your holiday, you must provide full details before confirming your booking. We will advise on the suitability of your chosen arrangements and, where necessary, direct you to appropriate resources. We cannot be held responsible for issues arising from undisclosed medical conditions or special needs.</p>
    `,
  },
  {
    number: "15",
    title: "Accommodation, Ratings, and Local Charges",
    contentHtml: `
      <p>Accommodation ratings are provided by the supplier and may vary by country. We cannot guarantee their accuracy. Rooms are allocated on arrival and are subject to availability. Certain amenities, including air conditioning, local taxes, resort fees, and hotel-run services, may carry an additional charge payable locally. You will be advised of any known charges at the time of booking.</p>
    `,
  },
  {
    number: "16",
    title: "Building Works and Third-Party Guests",
    contentHtml: `
      <p>Where we are notified of significant building or refurbishment works that may affect your stay, we will inform you prior to departure. If the works are considered to materially affect your holiday, we will seek appropriate remedies from the supplier. We do not have exclusive use of the properties we feature, and other guests, including corporate groups, may be present during your stay.</p>
    `,
  },
  {
    number: "17",
    title: "Behaviour and Indemnity",
    contentHtml: `
      <p>You are expected to conduct yourself in an orderly and lawful manner throughout your trip. Suppliers reserve the right to terminate your booking or remove you from the property or transport without refund if your behaviour is deemed disruptive, threatening, or damaging. You will be liable for any damage caused to property. You agree to fully indemnify us and our Agents against any claims, costs, or losses arising from your conduct or that of any member of your party.</p>
    `,
  },
  {
    number: "18",
    title: "Delivery of Documents",
    contentHtml: `
      <p>We are not responsible for the loss of travel documents once they have been delivered to you, unless the loss is attributable to our negligence. Charges may apply for the reissuance of lost or damaged documents.</p>
    `,
  },
  {
    number: "19",
    title: "Final Travel Checks",
    contentHtml: `
      <p>You are responsible for checking all travel documents carefully before departure. Please reconfirm your flights directly with the airline at least <strong>72 hours before departure</strong>, as flight times may change after your booking is confirmed.</p>
    `,
  },
  {
    number: "20",
    title: "Complaints",
    contentHtml: `
      <p>If you experience any issues during your trip, you must report them immediately to your JLT Agent and to the relevant supplier so that steps can be taken to resolve the matter at the time. If the issue remains unresolved, you must submit a formal written complaint to us <strong>within 28 days of your return date</strong>. Failure to follow this procedure may affect our ability to investigate your complaint and could impact your rights. Unresolved disputes may be escalated through Protected Trust Services (PTS) or an appropriate Alternative Dispute Resolution (ADR) scheme.</p>
    `,
  },
  {
    number: "21",
    title: "Privacy",
    contentHtml: `
      <p>We respect your privacy and are committed to protecting your personal data. Your information will be used to fulfil your booking and may be shared with suppliers, airlines, and relevant authorities as required. Our full Privacy Policy is available on our website.</p>
    `,
  },
  {
    number: "22",
    title: "Governing Law",
    contentHtml: `
      <p>These Terms and any dispute or claim arising out of or in connection with them are governed by English law. You agree that the courts of England and Wales have jurisdiction to settle any disputes, however, if you live in Scotland or Northern Ireland, you may choose to bring proceedings in your local courts under Scottish or Northern Irish law.</p>
      <p>For all booking enquiries, please contact your JLT Agent or our support team at <a href="mailto:support@thejltgroup.co.uk">support@thejltgroup.co.uk</a>.</p>
    `,
  },
];
