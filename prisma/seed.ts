import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();
const day = 24 * 60 * 60 * 1000;
const fromNow = (days: number) => new Date(Date.now() + days * day);

async function main() {
  await db.submission.deleteMany();
  await db.campaign.deleteMany();
  await db.user.deleteMany();

  const wanjiru = await db.user.create({
    data: { email: 'wanjiru@example.com', name: 'Wanjiru Kamau', handle: '@wanjiru.eats', role: 'INFLUENCER' },
  });
  const otieno = await db.user.create({
    data: { email: 'otieno@example.com', name: 'Otieno Odhiambo', handle: '@otieno.fits', role: 'INFLUENCER' },
  });
  await db.user.create({ data: { email: 'reviews@example.com', name: 'Savanna Brands', role: 'BRAND' } });

  const brief = (lines: string[]) => lines.join('\n');

  await db.campaign.create({
    data: {
      influencerId: wanjiru.id,
      title: 'Mango Splash launch',
      brandName: 'Jua Juice',
      description: 'Introduce the new mango and passion juice to Nairobi students.',
      instructions: brief([
        'Film a 30 to 45 second video of your first sip.',
        'Show the bottle and the Jua Juice logo in the first 3 seconds.',
        'Mention that it is made with Kenyan mangoes.',
        'Use #JuaJuice and tag @juajuice.ke.',
      ]),
      platform: 'TikTok',
      contentType: 'Video',
      minimumEngagement: 2000,
      feeKes: 18000,
      deadline: fromNow(9),
    },
  });

  await db.campaign.create({
    data: {
      influencerId: wanjiru.id,
      title: 'Weekend brunch spots',
      brandName: 'Kahawa House',
      description: 'A carousel of the brunch menu at the Upper Hill branch.',
      instructions: brief(['Post a 5 to 8 photo carousel.', 'Include the pancakes and the Kenyan AA coffee.', 'Add the branch location tag.']),
      platform: 'Instagram',
      contentType: 'Carousel',
      minimumEngagement: 1500,
      feeKes: 12000,
      deadline: fromNow(4),
      status: 'REJECTED',
      submissions: {
        create: {
          link: 'https://www.instagram.com/p/brunch-draft-1/',
          notes: 'Shot on Saturday morning',
          submittedAt: fromNow(-3),
          decision: 'REJECTED',
          reviewNote: 'Lovely photos. Please add the coffee shot and the location tag, then resubmit.',
          reviewedAt: fromNow(-2),
        },
      },
    },
  });

  await db.campaign.create({
    data: {
      influencerId: wanjiru.id,
      title: 'Street food tour, CBD',
      brandName: 'Mlo',
      description: 'Order three street food favourites through the Mlo app and review them.',
      instructions: brief(['Show the app ordering flow in the first 10 seconds.', 'Rate each dish out of 10.', 'Keep it under 60 seconds.']),
      platform: 'YouTube',
      contentType: 'Short',
      minimumEngagement: 3000,
      feeKes: 15000,
      deadline: fromNow(2),
      status: 'SUBMITTED',
      submissions: {
        create: {
          link: 'https://youtube.com/shorts/mlo-street-food',
          notes: 'Posted at 6pm for the after-work crowd',
          submittedAt: fromNow(-1),
        },
      },
    },
  });

  await db.campaign.create({
    data: {
      influencerId: wanjiru.id,
      title: 'Solar for small kitchens',
      brandName: 'Mwangaza Solar',
      description: 'Show how a home solar kit keeps a small kitchen running during outages.',
      instructions: brief(['Film during an evening outage if you can.', 'Show the lights and phone charging.', 'Mention M-Pesa checkout.']),
      platform: 'TikTok',
      contentType: 'Video',
      minimumEngagement: 2500,
      feeKes: 20000,
      deadline: fromNow(-10),
      status: 'APPROVED',
      submissions: {
        create: {
          link: 'https://www.tiktok.com/@wanjiru.eats/video/7301',
          submittedAt: fromNow(-14),
          decision: 'APPROVED',
          reviewNote: 'Great energy. Approved.',
          reviewedAt: fromNow(-12),
          likes: 4200,
          comments: 310,
          shares: 180,
        },
      },
    },
  });

  await db.campaign.create({
    data: {
      influencerId: wanjiru.id,
      title: 'Back to school lunchboxes',
      brandName: 'Shamba Fresh',
      description: 'Three quick lunchbox ideas using Shamba Fresh vegetables.',
      instructions: brief(['Show all three lunchboxes being packed.', 'Mention delivery within Nairobi.']),
      platform: 'Instagram',
      contentType: 'Reel',
      minimumEngagement: 1200,
      feeKes: 9000,
      deadline: fromNow(-25),
      status: 'APPROVED',
      submissions: {
        create: {
          link: 'https://www.instagram.com/reel/lunchbox-ideas/',
          submittedAt: fromNow(-28),
          decision: 'APPROVED',
          reviewedAt: fromNow(-27),
          likes: 980,
          comments: 64,
          shares: 41,
        },
      },
    },
  });

  await db.campaign.create({
    data: {
      influencerId: otieno.id,
      title: 'Matatu-ready trainers',
      brandName: 'Kikoi Threads',
      description: 'Style the new trainers for a Nairobi commute.',
      instructions: brief(['Three outfits, one pair of trainers.', 'Film at a stage or on a matatu if allowed.']),
      platform: 'TikTok',
      contentType: 'Video',
      minimumEngagement: 1800,
      feeKes: 14000,
      deadline: fromNow(6),
      status: 'SUBMITTED',
      submissions: {
        create: {
          link: 'https://www.tiktok.com/@otieno.fits/video/5512',
          submittedAt: fromNow(-1),
        },
      },
    },
  });

  console.log('Seeded 3 users and 6 campaigns');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
