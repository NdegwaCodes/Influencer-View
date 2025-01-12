import { NextApiRequest, NextApiResponse } from "next";
import { MongoClient, Db, Collection } from "mongodb";
import { Campaign } from "@/interfaces/campaigns";

const defaultCampaignID = process.env.DEFAULT_CAMPAIGN_ID as string;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  const client = new MongoClient(process.env.MONGODB_URI as string, {});

  try {
    await client.connect();

    // Define types for database and collection
    const database: Db = client.db("InfluencerView");
    const collection: Collection<Campaign> =
      database.collection<Campaign>("Campaigns");

    // GET : Fetch campaigns the influencer has joined.
    if (req.method === "GET") {
      try {
        const allData = await collection.find({}).toArray();

        res.status(200).json(allData);
      } catch (error) {
        console.error("Error fetching data:", error);
        res.status(500).json({ message: "Something went wrong!" });
      }
    }
    //POST: Submit campaign content (e.g., a link to a TikTok post)
    else if (req.method === "POST") {
      const { data }: { data: Campaign } = req.body;

      if (!data) {
        res.status(400).json({ message: "Data is required!" });
        return;
      }

      try {
        // Insert the data into the collection
        await collection.insertOne({
          ...data,
          campaignID: defaultCampaignID,
          approved: false,
        });

        res.status(201).json({ message: "Data saved successfully!" });
      } catch (error) {
        console.error("Error saving data:", error);
        res.status(500).json({ message: "Something went wrong!" });
      }
    } else {
      res.status(405).json({ message: "Method not allowed!" });
    }
  } finally {
    await client.close();
  }
}
