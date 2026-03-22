import { updatePost, savePost } from './lib/storage.js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function testPersistence() {
  console.log("Creating test post...");
  const post = await savePost({
    title: "Social Icon Test Post",
    content: "Testing if social links persist.",
    metaDescription: "Test description",
    keyword: "test",
    status: 'published'
  });

  console.log("Post created with ID:", post.id);

  console.log("Updating post with social links...");
  const updated = await updatePost(post.id, {
    instagramUrl: "https://instagram.com/test",
    twitterUrl: "https://x.com/test",
    tiktokUrl: "https://tiktok.com/@test"
  });

  if (updated && updated.instagramUrl === "https://instagram.com/test") {
    console.log("✅ Persistence successful!");
  } else {
    console.log("❌ Persistence failed!");
  }
}

testPersistence();
