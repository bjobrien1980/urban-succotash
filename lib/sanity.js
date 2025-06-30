// lib/sanity.js - Create this file in your project
import {createClient} from '@sanity/client'

export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID, // You'll get this from Sanity
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  useCdn: true, // Set to false if statically generating pages, using ISR or tag-based revalidation
  apiVersion: '2023-05-03', // Use current date (YYYY-MM-DD) to target the latest API version
  // token: process.env.SANITY_SECRET_TOKEN, // Only if you want to update content
})

// Helper function to fetch union posts
export async function getUnionPosts() {
  return client.fetch(`
    *[_type == "unionPost"] | order(publishedAt desc) {
      _id,
      title,
      content,
      unionName,
      publishedAt,
      tags,
      priority,
      url,
      category
    }
  `)
}

// Helper function to fetch recent union posts
export async function getRecentUnionPosts(limit = 10) {
  return client.fetch(`
    *[_type == "unionPost"] | order(publishedAt desc)[0...${limit}] {
      _id,
      title,
      content,
      unionName,
      publishedAt,
      tags,
      priority,
      url,
      category
    }
  `)
}
