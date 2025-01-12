import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.engagement.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.requirements.deleteMany();
  await prisma.campaign.deleteMany();

  // Create campaigns with submissions and requirements
  const campaigns = [
    {
      title: "Summer Fashion Collection",
      description: "Showcase our new summer fashion line",
      instructions: "Create a 60-second TikTok video featuring at least 3 items from our collection",
      deadline: new Date("2024-06-15"),
      status: "pending",
      influencerID: "inf_123",
      requirements: {
        create: {
          platform: "TikTok",
          contentType: "Video",
          minimumEngagement: 1000
        }
      }
    },
    {
      title: "Fitness Challenge",
      description: "30-day workout challenge promotion",
      instructions: "Share your workout routine using our products",
      deadline: new Date("2024-05-20"),
      status: "submitted",
      influencerID: "inf_123",
      requirements: {
        create: {
          platform: "Instagram",
          contentType: "Reel",
          minimumEngagement: 2000
        }
      },
      submission: {
        create: {
          link: "https://instagram.com/post/123",
          notes: "Completed the workout challenge",
          submittedAt: new Date("2024-05-01"),
          engagement: {
            create: {
              likes: 2500,
              shares: 150,
              comments: 300
            }
          }
        }
      }
    },
    {
      title: "Healthy Smoothie Recipe",
      description: "Create content featuring our new blender",
      instructions: "Make a unique smoothie recipe using our blender",
      deadline: new Date("2024-05-10"),
      status: "approved",
      influencerID: "inf_123",
      requirements: {
        create: {
          platform: "YouTube",
          contentType: "Short",
          minimumEngagement: 5000
        }
      },
      submission: {
        create: {
          link: "https://youtube.com/shorts/abc",
          notes: "Created a tropical smoothie recipe",
          submittedAt: new Date("2024-04-15"),
          engagement: {
            create: {
              likes: 6000,
              shares: 800,
              comments: 450
            }
          }
        }
      }
    },
    {
      title: "Gaming Headset Review",
      description: "Review our new gaming headset",
      instructions: "Create a detailed review highlighting key features",
      deadline: new Date("2024-07-01"),
      status: "rejected",
      influencerID: "inf_123",
      requirements: {
        create: {
          platform: "Twitch",
          contentType: "Stream",
          minimumEngagement: 3000
        }
      },
      submission: {
        create: {
          link: "https://twitch.tv/videos/xyz",
          notes: "Completed review but audio quality issues",
          submittedAt: new Date("2024-06-20"),
          engagement: {
            create: {
              likes: 1200,
              shares: 50,
              comments: 180
            }
          }
        }
      }
    }
  ];

  for (const campaign of campaigns) {
    await prisma.campaign.create({
      data: campaign
    });
  }

  console.log('Seed data inserted successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 