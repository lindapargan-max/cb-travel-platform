// ─── Social Hub Router ────────────────────────────────────────────────────
// Add these endpoints to your server/routers.ts

import { z } from "zod";
import { eq } from "drizzle-orm";
import { socialPosts } from "../drizzle/schema";

// Schema for creating social posts
const CreateSocialPostSchema = z.object({
  platform: z.enum(["instagram", "facebook", "twitter", "tiktok", "linkedin"]),
  title: z.string().optional(),
  body: z.string().min(1),
  caption: z.string().optional(),
  hashtags: z.string().optional(),
  imagePrompt: z.string().optional(),
  imageUrl: z.string().optional(),
  scheduledFor: z.date().optional(),
  tags: z.array(z.string()).optional(),
});

type CreateSocialPostInput = z.infer<typeof CreateSocialPostSchema>;

// Add these to your t.router in routers.ts:

export const socialHubRouter = {
  // Generate a week of posts with varied content
  generateWeek: t.procedure
    .input(z.object({
      platform: z.enum(["facebook", "instagram", "twitter"]),
      destinationCount: z.number().default(3),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const user = ctx.user;

      // Fetch real data from your platform
      const [
        topDestinations,
        recentBookings,
        deals,
        destinations,
        testimonials,
      ] = await Promise.all([
        db.query.destinations.findMany({ limit: 10 }),
        db.query.bookings.findMany({ 
          limit: 5,
          orderBy: (t) => desc(t.createdAt),
        }),
        db.query.deals.findMany({ limit: 5 }),
        db.query.destinationGuides.findMany({ limit: 15 }),
        db.query.testimonials.findMany({ limit: 5 }),
      ]);

      const week = generateWeekPosts(
        topDestinations,
        recentBookings,
        deals,
        destinations,
        testimonials,
        input.platform
      );

      // Save all posts as drafts
      const savedPosts = await Promise.all(
        week.map((post) =>
          db.insert(socialPosts).values({
            platform: input.platform as any,
            title: post.title,
            body: post.body,
            caption: post.caption,
            hashtags: post.hashtags,
            imagePrompt: post.imagePrompt,
            status: "draft",
            tags: post.tags,
            createdBy: user.id,
          })
        )
      );

      return {
        success: true,
        posts: week,
        count: week.length,
      };
    }),

  // Get posts for the current week
  getWeekPosts: t.procedure
    .input(z.object({
      platform: z.enum(["facebook", "instagram", "twitter"]).optional(),
      status: z.enum(["draft", "scheduled", "published"]).optional(),
    }))
    .query(async ({ input }) => {
      const db = getDb();
      
      const where = [];
      if (input.platform) where.push(eq(socialPosts.platform, input.platform));
      if (input.status) where.push(eq(socialPosts.status, input.status));

      const posts = await db.query.socialPosts.findMany({
        where: where.length > 0 ? and(...where) : undefined,
        limit: 50,
      });

      return posts;
    }),

  // Update post
  updatePost: t.procedure
    .input(z.object({
      id: z.number(),
      ...CreateSocialPostSchema.partial().shape,
    }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      
      const { id, ...data } = input;
      
      await db
        .update(socialPosts)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(socialPosts.id, id));

      return { success: true };
    }),

  // Schedule a post
  schedulePost: t.procedure
    .input(z.object({
      id: z.number(),
      scheduledFor: z.date(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      
      await db
        .update(socialPosts)
        .set({
          scheduledFor: input.scheduledFor,
          status: "scheduled",
          updatedAt: new Date(),
        })
        .where(eq(socialPosts.id, input.id));

      return { success: true };
    }),

  // Delete post
  deletePost: t.procedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      
      await db.delete(socialPosts).where(eq(socialPosts.id, input.id));
      
      return { success: true };
    }),
};

// ─── Post Generation Helper ────────────────────────────────────────────────

interface GeneratedPost {
  title: string;
  body: string;
  caption: string;
  hashtags: string;
  imagePrompt: string;
  tags: string[];
}

function generateWeekPosts(
  topDestinations: any[],
  recentBookings: any[],
  deals: any[],
  destinationGuides: any[],
  testimonials: any[],
  platform: string
): GeneratedPost[] {
  const posts: GeneratedPost[] = [];
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  // Monday: Travel Hack
  posts.push({
    title: "Monday Travel Hack 🎒",
    body: generateTravelHack(),
    caption: "Start your week with a money-saving travel hack!",
    hashtags: "#TravelHacks #BudgetTravel #TravelTips #Wanderlust #SavMoney",
    imagePrompt: "travel budget tips, money saving, passport, airplane",
    tags: ["travelHack", "budget"],
  });

  // Tuesday: Destination Spotlight
  if (topDestinations.length > 0) {
    const dest = topDestinations[0];
    posts.push({
      title: "Tuesday Spotlight: " + dest.name + " ✨",
      body: generateDestinationSpotlight(dest),
      caption: `Discover the magic of ${dest.name}!`,
      hashtags: `#${dest.name?.replace(/\s/g, "")} #DestinationSpotlight #Travel #Wanderlust #Adventure`,
      imagePrompt: `${dest.name}, scenic landscapes, travel destination, beautiful`,
      tags: ["destination", dest.name || ""],
    });
  }

  // Wednesday: Customer Story
  if (testimonials.length > 0 || recentBookings.length > 0) {
    posts.push({
      title: "Wednesday Win: Customer Story 🌟",
      body: generateCustomerStory(testimonials[0] || recentBookings[0]),
      caption: "Our clients' favorite travel memories!",
      hashtags: "#CustomerStories #TravelMemories #HappyClients #TravelAdventures #RealReviews",
      imagePrompt: "happy travelers, vacation photos, destination experience",
      tags: ["customerStory", "testimonial"],
    });
  }

  // Thursday: Deal Alert
  if (deals.length > 0) {
    const deal = deals[0];
    posts.push({
      title: "Thursday Deal Alert 🎉",
      body: generateDealPost(deal),
      caption: `Limited time offer on ${deal.destination || "amazing experiences"}!`,
      hashtags: "#DealAlert #TravelDeals #LimitedTime #SpecialOffer #BookNow",
      imagePrompt: "discount, travel deal, special offer, savings",
      tags: ["deal", "offer"],
    });
  }

  // Friday: Featured Destination
  if (destinationGuides.length > 0) {
    const guide = destinationGuides[Math.floor(Math.random() * destinationGuides.length)];
    posts.push({
      title: "Friday Feature: " + guide.destination + " 🌴",
      body: generateFeaturedDestination(guide),
      caption: `Plan your next adventure to ${guide.destination}!`,
      hashtags: `#${guide.destination?.replace(/\s/g, "")} #Travel #Explore #Bucket ListDestination #NextAdventure`,
      imagePrompt: `${guide.destination}, travel guide, itinerary inspiration, vacation`,
      tags: ["featured", "guide"],
    });
  }

  // Saturday: Culture & Experience
  posts.push({
    title: "Saturday Culture 🎭",
    body: generateCulturePost(),
    caption: "Travel is about more than landmarks—it's about experiences!",
    hashtags: "#CulturalTravel #LocalExperiences #Wanderlust #Travel #Discovery",
    imagePrompt: "local culture, traditions, authentic experiences, community",
    tags: ["culture", "experience"],
  });

  // Sunday: Week Recap & CTA
  posts.push({
    title: "Sunday Plan: Where Will You Go? 🗺️",
    body: generateSundayRecap(),
    caption: "Ready to book your next adventure? We're here to help!",
    hashtags: "#TravelPlanning #AdventureAwaits #BookNow #TravelGoals #Wanderlust",
    imagePrompt: "travel planning, map, destinations, adventure checklist",
    tags: ["cta", "planning"],
  });

  return posts;
}

function generateTravelHack(): string {
  const hacks = [
    "💡 Pro tip: Book your flights on Tuesdays and Wednesdays for the best prices! Airlines typically release discounted fares mid-week.",
    "💡 Save 20-30% on hotels by booking directly on the hotel website instead of through third-party sites—many offer rate guarantees!",
    "💡 Use incognito mode when searching for flights to avoid price increases from tracking cookies!",
    "💡 Join loyalty programs BEFORE booking—you can often backdate stays and earn points on past reservations!",
  ];
  return hacks[Math.floor(Math.random() * hacks.length)];
}

function generateDestinationSpotlight(destination: any): string {
  return `Discover ${destination.name}! 🌍

From stunning landscapes to vibrant culture, ${destination.name} offers unforgettable memories. Whether you're seeking adventure, relaxation, or cultural immersion, this destination has it all.

✨ Perfect for: Adventure seekers, culture enthusiasts, relaxation
🏨 Best time to visit: Check our guides for seasonal insights
🎒 Ready to explore? Click the link in bio to start planning!`;
}

function generateCustomerStory(story: any): string {
  if (!story) return "Our clients share their most magical travel moments with us!";
  
  return `Meet our happy travelers! 😊

"This trip was absolutely magical. The planning was seamless, and every moment exceeded our expectations. We'll be booking with them again!"

From initial planning to the final sunset, we make sure every detail is perfect. Your dream vacation awaits!

📸 Share YOUR travel story in the comments below!`;
}

function generateDealPost(deal: any): string {
  return `🎉 SPECIAL OFFER ALERT! 🎉

Don't miss this incredible opportunity! Limited spots available for ${deal.destination || "our premium packages"}.

✈️ Exclusive pricing available THIS WEEK ONLY
⏰ Book by ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()} to secure your spot
🏖️ All-inclusive packages • Expert planning • Unforgettable experiences

DM us or click the link in bio. Spots are filling up fast! 🚀`;
}

function generateFeaturedDestination(guide: any): string {
  return `Featured Destination: ${guide.destination} 🌟

${guide.overview || "Explore this incredible destination with our comprehensive travel guide."}

📍 Must-see attractions
🍽️ Best dining experiences  
🏨 Handpicked accommodations
⏱️ Insider tips from local experts
🗺️ Custom itinerary suggestions

Ready to explore? Our guides have everything you need for the perfect trip! 

Link in bio → Plan your adventure today! ✨`;
}

function generateCulturePost(): string {
  const posts = [
    "Travel isn't just about the destination—it's about the stories you'll tell, the people you'll meet, and the perspectives you'll gain. 🌍✨",
    "The best souvenir you can bring home? New friendships, unforgettable memories, and a deeper understanding of our beautiful world. 🎒💖",
    "Authentic travel experiences come from stepping off the beaten path and engaging with local culture. What's your most memorable local encounter? 👇",
  ];
  return posts[Math.floor(Math.random() * posts.length)];
}

function generateSundayRecap(): string {
  return `As the weekend winds down, are you thinking about your next getaway? 🌴

We've shared inspiration all week—travel hacks, destination spotlights, amazing deals, and cultural gems.

The question is: WHERE WILL YOU GO NEXT? 🗺️

Whether it's a tropical beach, mountain adventure, city exploration, or cultural immersion, we're here to turn your travel dreams into reality.

📱 DM us to start planning
🔗 Link in bio to explore packages
💬 Comment your dream destination below!

Let's make it happen! ✈️🌟`;
}
