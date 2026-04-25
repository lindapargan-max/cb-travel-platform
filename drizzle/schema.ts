import {
  mysqlTable,
  int,
  varchar,
  text,
  boolean,
  timestamp,
  json,
  mediumtext,
  mysqlEnum,
  uniqueIndex,
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

// Users table
export const users = mysqlTable(
  "users",
  {
    id: int("id").autoincrement().primaryKey(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    password: varchar("password", { length: 255 }).notNull(),
    name: varchar("name", { length: 255 }),
    role: mysqlEnum("role", ["admin", "user", "moderator"]).default("user"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => {
    return {
      emailIdx: uniqueIndex("emailIdx").on(table.email),
    };
  }
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Destinations table
export const destinations = mysqlTable(
  "destinations",
  {
    id: int("id").autoincrement().primaryKey(),
    name: varchar("name", { length: 255 }).notNull().unique(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    description: text("description"),
    imageUrl: varchar("imageUrl", { length: 255 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => {
    return {
      slugIdx: uniqueIndex("slugIdx").on(table.slug),
    };
  }
);

export type Destination = typeof destinations.$inferSelect;
export type InsertDestination = typeof destinations.$inferInsert;

// Quote Requests table
export const quoteRequests = mysqlTable("quoteRequests", {
  id: int("id").autoincrement().primaryKey(),
  destinationId: int("destinationId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  message: text("message"),
  status: mysqlEnum("status", ["pending", "contacted", "completed"]).default(
    "pending"
  ),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type QuoteRequest = typeof quoteRequests.$inferSelect;
export type InsertQuoteRequest = typeof quoteRequests.$inferInsert;

// Blog Posts table
export const blogPosts = mysqlTable(
  "blogPosts",
  {
    id: int("id").autoincrement().primaryKey(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    title: varchar("title", { length: 255 }).notNull(),
    content: mediumtext("content"),
    excerpt: text("excerpt"),
    imageUrl: varchar("imageUrl", { length: 255 }),
    published: boolean("published").default(false),
    authorId: int("authorId"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => {
    return {
      slugIdx: uniqueIndex("blogPostsSlugIdx").on(table.slug),
    };
  }
);

export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = typeof blogPosts.$inferInsert;

// Destination Guides table (NEW)
export const destinationGuides = mysqlTable(
  "destinationGuides",
  {
    id: int("id").autoincrement().primaryKey(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    destination: varchar("destination", { length: 255 }).notNull(),
    country: varchar("country", { length: 255 }),
    region: varchar("region", { length: 255 }),
    continent: varchar("continent", { length: 255 }),
    heroImageBase64: mediumtext("heroImageBase64"),
    heroImageMimeType: varchar("heroImageMimeType", { length: 100 }),
    tagline: text("tagline"),
    overview: mediumtext("overview"),
    bestTimeToVisit: mediumtext("bestTimeToVisit"),
    climate: mediumtext("climate"),
    currency: varchar("currency", { length: 50 }),
    language: text("language"),
    timezone: varchar("timezone", { length: 50 }),
    flightTimeFromUK: varchar("flightTimeFromUK", { length: 100 }),
    attractions: json("attractions"),
    dining: json("dining"),
    accommodation: json("accommodation"),
    insiderTips: json("insiderTips"),
    gettingThere: mediumtext("gettingThere"),
    visaInfo: mediumtext("visaInfo"),
    curatedItinerary: json("curatedItinerary"),
    tags: json("tags"),
    featured: boolean("featured").default(false).notNull(),
    published: boolean("published").default(false).notNull(),
    viewCount: int("viewCount").default(0).notNull(),
    aiGenerated: boolean("aiGenerated").default(false).notNull(),
    createdBy: int("createdBy"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => {
    return {
      slugIdx: uniqueIndex("destinationGuidesSlugIdx").on(table.slug),
    };
  }
);

export type DestinationGuide = typeof destinationGuides.$inferSelect;
export type InsertDestinationGuide = typeof destinationGuides.$inferInsert;
