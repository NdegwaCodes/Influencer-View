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

    // GET: Fetch the list of influencers who joined a campaign and their submission details.
    if (req.method === "GET") {
      const { campaignID } = req.query;

      if (!campaignID || typeof campaignID !== "string") {
        res
          .status(400)
          .json({ message: "campaignID is required and must be a string!" });
        return;
      }

      try {
        // Aggregation pipeline to group influencers by their IDs
        const influencers = await collection
          .aggregate([
            {
              $match: { campaignID }, // Filter documents by campaignID
            },
            {
              $group: {
                _id: "$influencerID", // Group by influencerID
                influencerName: { $first: "$influencerName" }, // Include the influencer's name
                submissions: {
                  $push: {
                    date: "$date",
                    link: "$link",
                    approved: "$approved",
                  },
                },
              },
            },
            {
              $sort: { influencerName: 1 }, // Optionally sort by influencer name
            },
          ])
          .toArray();

        res.status(200).json(influencers);
      } catch (error) {
        console.error("Error fetching influencers:", error);
        res.status(500).json({ message: "Something went wrong!" });
      }
    }
    //PATCH: Approve or reject influencer content submissions.
    else if (req.method === "PATCH") {
      const { campaignID } = req.query;
      const updatedData: Partial<Campaign> = req.body; // Partial to allow partial updates

      if (!campaignID || typeof campaignID !== "string") {
        res
          .status(400)
          .json({ message: "campaignId is required and must be a string!" });
        return;
      }

      if (Object.keys(updatedData).length === 0) {
        res.status(400).json({ message: "No data provided for update!" });
        return;
      }

      try {
        // Update the campaign using campaignId
        const result = await collection.updateOne(
          { campaignID: defaultCampaignID },
          { $set: updatedData } // Set the updated fields
        );

        if (result.matchedCount === 0) {
          res.status(404).json({ message: "Campaign not found!" });
          return;
        }

        res.status(200).json({ message: "Campaign updated successfully!" });
      } catch (error) {
        console.error("Error updating campaign:", error);
        res.status(500).json({ message: "Something went wrong!" });
      }
    } else {
      res.status(405).json({ message: "Method not allowed!" });
    }
  } finally {
    await client.close();
  }
}
